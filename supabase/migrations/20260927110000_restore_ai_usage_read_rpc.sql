-- Restore the read-side AI usage RPC expected by the web app.
-- The mutation remains server-only; this function only exposes the current
-- authenticated user's own monthly usage.

create or replace function public.get_ai_usage(
  p_user_id uuid,
  p_period_start date,
  p_limit integer default 20
)
returns table(used integer, limit_value integer, remaining integer)
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce(
      (
        select greatest(least(au.used, greatest(p_limit, 0)), 0)
        from public.ai_usage au
        where au.user_id = p_user_id
          and au.period_start = p_period_start
      ),
      0
    )::integer as used,
    greatest(p_limit, 0)::integer as limit_value,
    greatest(
      greatest(p_limit, 0) - coalesce(
        (
          select greatest(least(au.used, greatest(p_limit, 0)), 0)
          from public.ai_usage au
          where au.user_id = p_user_id
            and au.period_start = p_period_start
        ),
        0
      ),
      0
    )::integer as remaining
  where auth.uid() = p_user_id;
$$;

revoke all on function public.get_ai_usage(uuid, date, integer) from public, anon;
grant execute on function public.get_ai_usage(uuid, date, integer) to authenticated;
