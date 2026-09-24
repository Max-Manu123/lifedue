-- Harden the shared monthly AI quota against concurrent first-use requests.
-- The unique (user_id, period_start) key plus ON CONFLICT makes each credit
-- reservation atomic: the 20th request is allowed and the 21st is rejected.
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
begin
  if p_limit <= 0 then
    return query select false, 0, 0;
    return;
  end if;

  insert into public.ai_usage (user_id, period_start, used, updated_at)
  values (p_user_id, p_period_start, 1, now())
  on conflict (user_id, period_start)
  do update
    set used = public.ai_usage.used + 1,
        updated_at = now()
    where public.ai_usage.used < p_limit;

  return query
    select
      coalesce(u.used <= p_limit, false) as allowed,
      least(coalesce(u.used, p_limit), p_limit) as used,
      greatest(p_limit - least(coalesce(u.used, p_limit), p_limit), 0) as remaining
    from public.ai_usage as u
    where u.user_id = p_user_id
      and u.period_start = p_period_start;

  if not found then
    return query select false, p_limit, 0;
  end if;
end;
$$;

revoke all on function public.consume_ai_credit(uuid, date, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, date, integer) to service_role;
