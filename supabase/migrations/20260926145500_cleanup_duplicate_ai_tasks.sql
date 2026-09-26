-- One-time cleanup for duplicate task rows created by the previous
-- onboarding/auth save race. Keep the oldest row for an exact duplicate
-- (same user, client, title, due date, and status).
--
-- This intentionally does not create a content-based unique constraint:
-- users may legitimately create two separate tasks with the same visible
-- details. Future AI onboarding saves are protected separately by source_key.
with ranked_tasks as (
  select
    id,
    row_number() over (
      partition by user_id, client_id, title, due_date, status
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.tasks
)
delete from public.tasks as tasks
using ranked_tasks
where tasks.id = ranked_tasks.id
  and ranked_tasks.duplicate_rank > 1;
