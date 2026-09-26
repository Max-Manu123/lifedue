-- Prevent the same AI-generated task from being persisted twice when
-- onboarding/authentication effects race or the save action is retried.
--
-- source_key is intentionally nullable: manual tasks do not receive one,
-- so this idempotency guard applies only to AI-generated task drafts.
alter table public.tasks
  add column if not exists source_key text;

alter table public.tasks
  drop constraint if exists tasks_user_source_key_unique;

alter table public.tasks
  add constraint tasks_user_source_key_unique unique (user_id, source_key);

create index if not exists tasks_user_source_key_idx
  on public.tasks(user_id, source_key);
