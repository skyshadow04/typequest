create table if not exists public.save_slots (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  save_data jsonb,
  constraint save_slots_name_not_empty check (btrim(name) <> '')
);

create index if not exists save_slots_user_id_idx
  on public.save_slots(user_id);

alter table public.save_slots enable row level security;

drop policy if exists "Users can read their own save slots"
  on public.save_slots;
create policy "Users can read their own save slots"
  on public.save_slots
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own save slots"
  on public.save_slots;
create policy "Users can insert their own save slots"
  on public.save_slots
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own save slots"
  on public.save_slots;
create policy "Users can update their own save slots"
  on public.save_slots
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own save slots"
  on public.save_slots;
create policy "Users can delete their own save slots"
  on public.save_slots
  for delete
  using ((select auth.uid()) = user_id);
