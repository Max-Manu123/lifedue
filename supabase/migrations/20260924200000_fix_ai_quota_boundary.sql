-- Fix the AI quota mutation so each request is handled atomically and the
-- 20th request is allowed while the 21st is rejected.
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
  next_used integer;
begin
  if p_limit <= 0 then
    return query select false, 0, 0;
    return;
  end if;

  select au.used
    into current_used
    from public.ai_usage as au
   where au.user_id = p_user_id
     and au.period_start = p_period_start
   for update;

  if current_used is null then
    insert into public.ai_usage (
      user_id,
      period_start,
      used,
      updated_at
    )
    values (
      p_user_id,
      p_period_start,
      1,
      now()
    );

    return query select true, 1, p_limit - 1;
    return;
  end if;

  if current_used >= p_limit then
    return query select false, least(current_used, p_limit), 0;
    return;
  end if;

  next_used := current_used + 1;

  update public.ai_usage as au
     set used = next_used,
         updated_at = now()
   where au.user_id = p_user_id
     and au.period_start = p_period_start;

  return query
    select
      true,
      next_used,
      greatest(p_limit - next_used, 0);
end;
$$;

revoke all on function public.consume_ai_credit(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, date, integer) to service_role;
