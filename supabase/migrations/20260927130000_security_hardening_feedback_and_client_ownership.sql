-- LifeDue security hardening
-- 1) Feedback is accepted only through a server-side, rate-limited RPC.
-- 2) Tasks/payments cannot reference a client owned by another user.

create or replace function public.submit_feedback(
  p_type text,
  p_rating text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  recent_count integer;
  daily_count integer;
begin
  if current_user_id is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  if p_type not in ('bug', 'idea', 'general', 'other') then
    raise exception 'Invalid feedback type' using errcode = '22023';
  end if;

  if p_rating is not null and p_rating not in ('great', 'okay', 'poor') then
    raise exception 'Invalid feedback rating' using errcode = '22023';
  end if;

  if p_message is null or char_length(trim(p_message)) not between 1 and 1200 then
    raise exception 'Invalid feedback message' using errcode = '22023';
  end if;

  -- Serialize submissions per user so concurrent requests cannot bypass
  -- the count by both checking the same window before either inserts.
  perform pg_advisory_xact_lock(hashtextextended(current_user_id::text, 0));

  select count(*)
    into recent_count
  from public.feedback
  where user_id = current_user_id
    and created_at > timezone('utc', now()) - interval '10 minutes';

  if recent_count >= 5 then
    raise exception 'FEEDBACK_RATE_LIMITED' using errcode = 'P0001';
  end if;

  select count(*)
    into daily_count
  from public.feedback
  where user_id = current_user_id
    and created_at > timezone('utc', now()) - interval '24 hours';

  if daily_count >= 30 then
    raise exception 'FEEDBACK_RATE_LIMITED' using errcode = 'P0001';
  end if;

  insert into public.feedback (
    user_id,
    email,
    type,
    rating,
    message
  )
  values (
    current_user_id,
    (select auth.jwt() ->> 'email'),
    p_type,
    p_rating,
    trim(p_message)
  );
end;
$$;

drop policy if exists "Users can insert their own feedback" on public.feedback;
revoke insert on public.feedback from anon, authenticated;
grant execute on function public.submit_feedback(text, text, text) to authenticated;

create or replace function public.enforce_client_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  client_owner_id uuid;
begin
  if new.client_id is null then
    return new;
  end if;

  select c.user_id
    into client_owner_id
  from public.clients as c
  where c.id = new.client_id;

  if client_owner_id is distinct from new.user_id then
    raise exception 'CLIENT_NOT_OWNED' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_enforce_client_ownership on public.tasks;
create trigger tasks_enforce_client_ownership
  before insert or update of user_id, client_id
  on public.tasks
  for each row
  execute function public.enforce_client_ownership();

drop trigger if exists payments_enforce_client_ownership on public.payments;
create trigger payments_enforce_client_ownership
  before insert or update of user_id, client_id
  on public.payments
  for each row
  execute function public.enforce_client_ownership();

revoke all on function public.enforce_client_ownership() from public;
