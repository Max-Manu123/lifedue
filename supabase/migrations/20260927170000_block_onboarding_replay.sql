-- Case 2: a completed onboarding generation must never be replayed as
-- another successful generation. The original result remains stored for
-- server-side audit/recovery, but the generation endpoint must return the
-- one-time-used state so the client cannot obtain another onboarding result.

create or replace function public.reserve_onboarding_ai_generation(
  p_user_id uuid
)
returns table(allowed boolean, existing_result jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status text;
  current_reserved_at timestamptz;
begin
  if p_user_id is null then
    return query select false, null::jsonb;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':onboarding-ai', 0));

  select status, reserved_at
    into current_status, current_reserved_at
  from public.onboarding_ai_usage
  where user_id = p_user_id
  for update;

  -- A completed generation is permanently consumed. Do not replay the stored
  -- result as a fresh successful onboarding request.
  if current_status = 'completed' then
    return query select false, null::jsonb;
  end if;

  -- A crashed/abandoned generation may be retried after the safety window.
  if current_status = 'reserved'
     and current_reserved_at > now() - interval '2 minutes' then
    return query select false, null::jsonb;
  end if;

  if current_status is null then
    insert into public.onboarding_ai_usage (user_id, status, reserved_at, result)
    values (p_user_id, 'reserved', now(), null);
  else
    update public.onboarding_ai_usage
    set status = 'reserved',
        reserved_at = now(),
        completed_at = null,
        result = null
    where user_id = p_user_id;
  end if;

  return query select true, null::jsonb;
end;
$$;

revoke all on function public.reserve_onboarding_ai_generation(uuid) from public, anon, authenticated;
grant execute on function public.reserve_onboarding_ai_generation(uuid) to service_role;
