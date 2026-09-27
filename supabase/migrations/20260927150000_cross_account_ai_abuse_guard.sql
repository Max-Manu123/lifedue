-- Cross-account AI abuse guard.
-- A free account has 20 AI actions/month. This additional server-side
-- network guard prevents creating many accounts on the same network/device
-- to multiply the free quota.
create table if not exists public.ai_abuse_guard (
  abuse_key text not null,
  period_start date not null,
  used integer not null default 0 check (used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (abuse_key, period_start)
);

alter table public.ai_abuse_guard enable row level security;
revoke all on table public.ai_abuse_guard from public, anon, authenticated;

create or replace function public.consume_ai_abuse_credit(
  p_abuse_key text,
  p_period_start date,
  p_limit integer
)
returns table(allowed boolean, used integer, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_abuse_key is null or length(trim(p_abuse_key)) < 16 or p_limit <= 0 then
    return query select false, 0, 0;
    return;
  end if;

  insert into public.ai_abuse_guard (abuse_key, period_start, used, updated_at)
  values (p_abuse_key, p_period_start, 1, now())
  on conflict (abuse_key, period_start)
  do update
    set used = public.ai_abuse_guard.used + 1,
        updated_at = now()
    where public.ai_abuse_guard.used < p_limit;

  return query
    select
      coalesce(u.used <= p_limit, false) as allowed,
      coalesce(u.used, p_limit) as used,
      greatest(p_limit - coalesce(u.used, p_limit), 0) as remaining
    from public.ai_abuse_guard u
    where u.abuse_key = p_abuse_key
      and u.period_start = p_period_start;

  if not found then
    return query select false, p_limit, 0;
  end if;
end;
$$;

create or replace function public.refund_ai_abuse_credit(
  p_abuse_key text,
  p_period_start date
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_abuse_guard
  set used = greatest(used - 1, 0),
      updated_at = now()
  where abuse_key = p_abuse_key
    and period_start = p_period_start;
$$;

revoke all on function public.consume_ai_abuse_credit(text, date, integer) from public, anon, authenticated;
revoke all on function public.refund_ai_abuse_credit(text, date) from public, anon, authenticated;
grant execute on function public.consume_ai_abuse_credit(text, date, integer) to service_role;
grant execute on function public.refund_ai_abuse_credit(text, date) to service_role;
