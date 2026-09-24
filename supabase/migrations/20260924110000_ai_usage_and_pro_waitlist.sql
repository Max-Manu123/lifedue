-- LifeDue AI usage and Pro waitlist support
-- Free users receive 20 successful AI actions per calendar month.
-- Usage is counted server-side so the browser cannot bypass the limit.

alter table public.profiles
  add column if not exists pro_waitlist_email text;

create table if not exists public.pro_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.pro_waitlist enable row level security;

drop policy if exists "Users can read own Pro waitlist entry" on public.pro_waitlist;
create policy "Users can read own Pro waitlist entry"
  on public.pro_waitlist for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own Pro waitlist entry" on public.pro_waitlist;
create policy "Users can insert own Pro waitlist entry"
  on public.pro_waitlist for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant select, insert on table public.pro_waitlist to authenticated;

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  used integer not null default 0 check (used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

alter table public.ai_usage enable row level security;

drop policy if exists "Users can read own AI usage" on public.ai_usage;
create policy "Users can read own AI usage"
  on public.ai_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on table public.ai_usage to authenticated;

-- The quota mutation is intentionally server-only. The Edge Function validates
-- the caller JWT before calling this function with the authenticated user id.
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
      coalesce(u.used, p_limit) as used,
      greatest(p_limit - coalesce(u.used, p_limit), 0) as remaining
    from public.ai_usage u
    where u.user_id = p_user_id
      and u.period_start = p_period_start;

  if not found then
    return query select false, p_limit, 0;
  end if;
end;
$$;

create or replace function public.refund_ai_credit(
  p_user_id uuid,
  p_period_start date
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage
  set used = greatest(used - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and period_start = p_period_start;
$$;

revoke all on function public.consume_ai_credit(uuid, date, integer) from public, anon, authenticated;
revoke all on function public.refund_ai_credit(uuid, date) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, date, integer) to service_role;
grant execute on function public.refund_ai_credit(uuid, date) to service_role;
