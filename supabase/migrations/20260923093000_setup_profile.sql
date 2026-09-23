-- Keep the existing public.profile table usable and link every profile to auth.users.
alter table if exists public.profile
  add column if not exists created_at timestamptz;

alter table if exists public.profile
  add column if not exists email text;

-- Keep the user's existing create_at column compatible when it exists.
update public.profile
set created_at = coalesce(created_at, create_at, timezone('utc', now()))
where created_at is null;

alter table if exists public.profile
  alter column created_at set default timezone('utc', now());

do $
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profile' and column_name = 'create_at'
  ) then
    execute 'update public.profile set create_at = coalesce(create_at, timezone(''utc'', now())) where create_at is null';
    execute 'alter table public.profile alter column create_at set default timezone(''utc'', now())';
  end if;
end $;

-- One profile per authenticated user.
do $$
begin
  if to_regclass('public.profile') is not null then
    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.profile'::regclass
        and contype = 'p'
    ) then
      alter table public.profile add constraint profile_pkey primary key (id);
    end if;

    if not exists (
      select 1
      from pg_constraint
      where conrelid = 'public.profile'::regclass
        and conname = 'profile_id_fkey'
    ) then
      alter table public.profile
        add constraint profile_id_fkey
        foreign key (id) references auth.users(id) on delete cascade;
    end if;
  end if;
end $$;

alter table public.profile enable row level security;

drop policy if exists "Users can read their own profile" on public.profile;
create policy "Users can read their own profile"
  on public.profile
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profile;
create policy "Users can update their own profile"
  on public.profile
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke all on public.profile from anon;
grant select, update on public.profile to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile (id, email, created_at)
  values (new.id, new.email, timezone('utc', now()))
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Repair accounts that already existed before the trigger was installed.
insert into public.profile (id, email, created_at)
select u.id, u.email, coalesce(u.created_at, timezone('utc', now()))
from auth.users u
on conflict (id) do update
set email = excluded.email;
