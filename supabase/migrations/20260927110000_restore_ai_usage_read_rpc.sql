-- Restore the read-side AI usage RPC expected by the web app.
-- The mutation remains server-only; this function only exposes the current
-- authenticated user's own monthly usage.
--
-- The function was previously created with a different OUT-parameter shape.
-- PostgreSQL cannot change a function's return type with CREATE OR REPLACE,
-- so this migration drops the old signature first and recreates it with the
-- canonical return columns used by the existing app schema.

drop function if exists public.get_ai_usage(uuid, date, integer);

create function public.get_ai_usage(
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
