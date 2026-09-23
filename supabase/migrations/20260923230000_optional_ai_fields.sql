-- LifeDue: make AI-extracted optional fields persist without inventing values.
-- Existing rows remain valid; their existing dates are treated as explicit.
alter table public.tasks
  add column if not exists due_date_is_explicit boolean not null default true;

alter table public.payments
  add column if not exists due_date_is_explicit boolean not null default true;

alter table public.payments
  alter column currency drop not null;

-- A payment record is only created by the app when an amount is known.
-- Currency may remain null until the user supplies it.
