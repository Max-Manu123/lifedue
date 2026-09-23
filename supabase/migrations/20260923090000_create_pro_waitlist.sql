create table if not exists public.pro_waitlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id),
  unique (email)
);

alter table public.pro_waitlist enable row level security;

drop policy if exists "Users can join their own Pro waitlist entry" on public.pro_waitlist;
create policy "Users can join their own Pro waitlist entry"
  on public.pro_waitlist
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own Pro waitlist entry" on public.pro_waitlist;
create policy "Users can read their own Pro waitlist entry"
  on public.pro_waitlist
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.pro_waitlist from anon;
grant insert, select on public.pro_waitlist to authenticated;
