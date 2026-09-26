-- Keep existing LifeDue projects compatible with the current client.
-- These statements are idempotent and safe to apply to an existing database.

alter table public.tasks
  add column if not exists created_at timestamptz not null default now();

alter table public.tasks
  add column if not exists due_date_is_explicit boolean not null default true;

alter table public.tasks
  add column if not exists source_key text;

alter table public.payments
  add column if not exists due_date_is_explicit boolean not null default true;

alter table public.payments
  alter column currency drop not null;

create unique index if not exists tasks_user_source_key_unique_idx
  on public.tasks(user_id, source_key)
  where source_key is not null;

create index if not exists tasks_user_source_key_idx
  on public.tasks(user_id, source_key);

create index if not exists tasks_user_client_due_idx
  on public.tasks(user_id, client_id, due_date);

create index if not exists payments_user_client_due_idx
  on public.payments(user_id, client_id, due_date);
