-- Professional monthly AI usage status.
-- A new calendar-month key naturally starts each user at 0/20 without
-- carrying the previous month's usage into the new month.
create or replace function public.get_ai_usage(
  p_user_id uuid,
  p_period_start date,
  p_limit integer
)
returns table(used integer, remaining integer, monthly_limit integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_used integer;
  safe_used integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Not authorized';
  end if;

  if p_limit <= 0 then
    return query select 0, 0, 0;
    return;
  end if;

  select au.used
    into current_used
    from public.ai_usage as au
   where au.user_id = p_user_id
     and au.period_start = p_period_start;

  safe_used := least(greatest(coalesce(current_used, 0), 0), p_limit);

  -- Repair any legacy over-limit value so the current month can never
  -- display or carry an impossible value such as 25/20.
  if current_used is not null and current_used <> safe_used then
    update public.ai_usage as au
       set used = safe_used,
           updated_at = now()
     where au.user_id = p_user_id
       and au.period_start = p_period_start;
  end if;

  return query
    select
      safe_used,
      greatest(p_limit - safe_used, 0),
      p_limit;
end;
$$;

revoke all on function public.get_ai_usage(uuid, date, integer) from public, anon;
grant execute on function public.get_ai_usage(uuid, date, integer) to authenticated;
