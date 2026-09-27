-- One-time onboarding AI generation guard.
-- Anonymous onboarding users get exactly one successful generation per
-- anonymous Supabase identity. The server, not localStorage, is authoritative.

create table if not exists public.onboarding_ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'reserved'
    check (status in ('reserved', 'completed')),
  reserved_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.onboarding_ai_usage enable row level security;

-- This table is intentionally server-managed only. Anonymous/authenticated
-- clients must never be able to read or mutate the guard directly.
revoke all on table public.onboarding_ai_usage from public, anon, authenticated;

create or replace function public.reserve_onboarding_ai_generation(
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  current_reserved_at timestamptz;
begin
  if p_user_id is null then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':onboarding-ai', 0));

  select status, reserved_at
    into current_status, current_reserved_at
  from public.onboarding_ai_usage
  where user_id = p_user_id
  for update;

  if current_status = 'completed' then
    return false;
  end if;

  -- A crashed/abandoned generation may release its reservation after a short
  -- safety window. The Edge Function itself times out far earlier than this.
  if current_status = 'reserved'
     and current_reserved_at > now() - interval '2 minutes' then
    return false;
  end if;

  if current_status is null then
    insert into public.onboarding_ai_usage (user_id, status, reserved_at)
    values (p_user_id, 'reserved', now());
  else
    update public.onboarding_ai_usage
    set status = 'reserved',
        reserved_at = now(),
        completed_at = null
    where user_id = p_user_id;
  end if;

  return true;
end;
$$;

create or replace function public.complete_onboarding_ai_generation(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.onboarding_ai_usage
  set status = 'completed',
      completed_at = now()
  where user_id = p_user_id
    and status = 'reserved';
end;
$$;

create or replace function public.release_onboarding_ai_generation(
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.onboarding_ai_usage
  where user_id = p_user_id
    and status = 'reserved';
end;
$$;

revoke all on function public.reserve_onboarding_ai_generation(uuid) from public, anon, authenticated;
revoke all on function public.complete_onboarding_ai_generation(uuid) from public, anon, authenticated;
revoke all on function public.release_onboarding_ai_generation(uuid) from public, anon, authenticated;

grant execute on function public.reserve_onboarding_ai_generation(uuid) to service_role;
grant execute on function public.complete_onboarding_ai_generation(uuid) to service_role;
grant execute on function public.release_onboarding_ai_generation(uuid) to service_role;
