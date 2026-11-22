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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "Users can read their own profile"
  on public.profiles;
create policy "Users can read their own profile"
  on public.profiles
  for select
  using ((select auth.uid()) = id);

create or replace function public.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, created_at)
  values (new.id, new.email, new.created_at)
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.sync_auth_user_profile();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_auth_user_profile();

insert into public.profiles (id, email, created_at)
select id, email, created_at
from auth.users
on conflict (id) do update
set email = excluded.email;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin'))
);

alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;

-- Grant admin access manually in the Supabase SQL editor:
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'admin@example.com'
-- on conflict (user_id) do update set role = excluded.role;
