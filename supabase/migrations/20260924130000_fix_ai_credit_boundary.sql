create or replace function public.consume_ai_credit(
  p_user_id uuid,
  p_period_start date,
  p_limit integer
)
returns table(allowed boolean, used integer, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_used integer;
begin
  if p_limit <= 0 then
    return query select false, 0, 0;
  end if;

  select used
    into current_used
    from public.ai_usage
   where user_id = p_user_id
     and period_start = p_period_start
   for update;

  if current_used is null then
    insert into public.ai_usage (user_id, period_start, used, updated_at)
    values (p_user_id, p_period_start, 1, now());

    return query select true, 1, p_limit - 1;
  end if;

  if current_used >= p_limit then
    return query select false, current_used, 0;
  end if;

  update public.ai_usage
     set used = current_used + 1,
         updated_at = now()
   where user_id = p_user_id
     and period_start = p_period_start;

  return query select true, current_used + 1, greatest(p_limit - (current_used + 1), 0);
end;
$$;

revoke all on function public.consume_ai_credit(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, date, integer) to service_role;
