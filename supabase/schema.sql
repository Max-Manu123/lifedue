-- LifeDue MVP database schema
-- Run this in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  pro_waitlist_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  due_date date not null,
  due_date_is_explicit boolean not null default true,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'completed')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid references public.clients(id) on delete set null,
  amount numeric(12,2) not null default 0,
  currency text,
  due_date date not null,
  due_date_is_explicit boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  used integer not null default 0 check (used >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

create table if not exists public.pro_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_due_date_idx on public.tasks(user_id, due_date);
create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_due_date_idx on public.payments(user_id, due_date);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.tasks enable row level security;
alter table public.payments enable row level security;
alter table public.ai_usage enable row level security;
alter table public.pro_waitlist enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can read own AI usage"
  on public.ai_usage for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read own Pro waitlist entry"
  on public.pro_waitlist for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own Pro waitlist entry"
  on public.pro_waitlist for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can read own clients"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "Users can insert own clients"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "Users can update own clients"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "Users can delete own clients"
  on public.clients for delete
  using (auth.uid() = user_id);

create policy "Users can read own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

create policy "Users can read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users can insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own payments"
  on public.payments for update
  using (auth.uid() = user_id);

create policy "Users can delete own payments"
  on public.payments for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.consume_ai_credit(
  p_user_id uuid,
  p_period_start date,
  p_limit integer
)
returns table(allowed boolean, used integer, remaining integer)
language plpgsql
security definer
set search_path = ''
as $
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
      coalesce(u.used <= p_limit, false),
      coalesce(u.used, p_limit),
      greatest(p_limit - coalesce(u.used, p_limit), 0)
    from public.ai_usage u
    where u.user_id = p_user_id
      and u.period_start = p_period_start;

  if not found then
    return query select false, p_limit, 0;
  end if;
end;
$;

create or replace function public.refund_ai_credit(
  p_user_id uuid,
  p_period_start date
)
returns void
language sql
security definer
set search_path = ''
as $
  update public.ai_usage
  set used = greatest(used - 1, 0),
      updated_at = now()
  where user_id = p_user_id
    and period_start = p_period_start;
$;

-- Explicit PostgREST privileges for authenticated users.
grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.tasks to authenticated;
grant select, insert, update, delete on table public.payments to authenticated;
grant select on table public.ai_usage to authenticated;
grant select, insert on table public.pro_waitlist to authenticated;

revoke all on function public.consume_ai_credit(uuid, date, integer) from public, anon, authenticated;
revoke all on function public.refund_ai_credit(uuid, date) from public, anon, authenticated;
grant execute on function public.consume_ai_credit(uuid, date, integer) to service_role;
grant execute on function public.refund_ai_credit(uuid, date) to service_role;


-- Additional hardening for new environments.
-- These constraints protect the database even if a future client bypasses UI validation.
alter table public.payments
  drop constraint if exists payments_amount_nonnegative;
alter table public.payments
  add constraint payments_amount_nonnegative check (amount >= 0);

alter table public.clients
  drop constraint if exists clients_name_not_blank;
alter table public.clients
  add constraint clients_name_not_blank check (length(trim(name)) > 0);

alter table public.tasks
  drop constraint if exists tasks_title_not_blank;
alter table public.tasks
  add constraint tasks_title_not_blank check (length(trim(title)) > 0);

create index if not exists tasks_user_client_due_idx
  on public.tasks(user_id, client_id, due_date);

create index if not exists payments_user_client_due_idx
  on public.payments(user_id, client_id, due_date);
