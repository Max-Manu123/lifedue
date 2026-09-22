-- LifeDue feedback
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  type text not null check (type in ('bug', 'idea', 'general', 'other')),
  rating text check (rating in ('great', 'okay', 'poor')),
  message text not null check (char_length(trim(message)) between 1 and 1200),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.feedback enable row level security;

drop policy if exists "Users can insert their own feedback" on public.feedback;
create policy "Users can insert their own feedback"
  on public.feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can read their own feedback" on public.feedback;
create policy "Users can read their own feedback"
  on public.feedback
  for select
  to authenticated
  using (auth.uid() = user_id);

create index if not exists feedback_user_id_created_at_idx
  on public.feedback(user_id, created_at desc);

revoke all on public.feedback from anon;
grant insert, select on public.feedback to authenticated;
