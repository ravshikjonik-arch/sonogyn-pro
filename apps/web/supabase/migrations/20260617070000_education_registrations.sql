-- Education MVP: webinar/course registrations.
-- Stores doctor interest for scheduled learning sessions.

create table if not exists public.education_registrations (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  session_title text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  email text,
  question text,
  preferred_subtitle_language text not null default 'ru'
    check (preferred_subtitle_language in ('ru', 'en', 'es')),
  status text not null default 'new'
    check (status in ('new', 'contacted', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists education_registrations_session_idx
  on public.education_registrations (session_id, created_at desc);

create index if not exists education_registrations_user_idx
  on public.education_registrations (user_id, created_at desc);

alter table public.education_registrations enable row level security;

drop policy if exists education_registrations_insert_own on public.education_registrations;
create policy education_registrations_insert_own
  on public.education_registrations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists education_registrations_select_own on public.education_registrations;
create policy education_registrations_select_own
  on public.education_registrations
  for select
  using (auth.uid() = user_id);

drop policy if exists education_registrations_admin_all on public.education_registrations;
create policy education_registrations_admin_all
  on public.education_registrations
  for all
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
