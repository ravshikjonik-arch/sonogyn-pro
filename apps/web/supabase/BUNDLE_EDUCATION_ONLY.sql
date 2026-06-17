-- SonoGyn Pro · Education migrations only
-- Supabase Dashboard -> SQL Editor -> paste this file -> Run
-- Includes:
--   20260617070000_education_registrations.sql
--   20260617072000_education_sessions_broadcasts.sql

-- ========== 20260617070000_education_registrations.sql ==========
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

-- ========== 20260617072000_education_sessions_broadcasts.sql ==========
-- Education admin: editable sessions + broadcast queue.

create table if not exists public.education_sessions (
  id text primary key,
  title text not null,
  description text not null,
  format text not null check (format in ('live', 'recording', 'course')),
  status text not null default 'planned' check (status in ('registration', 'planned', 'recorded')),
  starts_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  instructor text not null default 'Якубов Р.В.',
  level text not null default 'Базовый',
  primary_language text not null default 'ru',
  subtitle_languages jsonb not null default '["ru"]'::jsonb,
  translation_plan text not null default '',
  meeting_provider text not null default 'Zoom/Meet',
  meeting_url text,
  href text,
  materials jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  agenda jsonb not null default '[]'::jsonb,
  outcomes jsonb not null default '[]'::jsonb,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists education_sessions_status_sort_idx
  on public.education_sessions (status, sort_order, created_at desc);

alter table public.education_sessions enable row level security;

drop policy if exists education_sessions_select_authenticated on public.education_sessions;
create policy education_sessions_select_authenticated
  on public.education_sessions
  for select
  using (auth.uid() is not null);

drop policy if exists education_sessions_admin_all on public.education_sessions;
create policy education_sessions_admin_all
  on public.education_sessions
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create table if not exists public.education_broadcasts (
  id uuid primary key default gen_random_uuid(),
  session_id text references public.education_sessions(id) on delete set null,
  recipient_filter text not null default 'confirmed'
    check (recipient_filter in ('all', 'new', 'contacted', 'confirmed')),
  recipient_count integer not null default 0,
  recipient_emails text[] not null default '{}',
  subject text not null,
  body text not null,
  status text not null default 'queued' check (status in ('draft', 'queued', 'sent', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists education_broadcasts_session_idx
  on public.education_broadcasts (session_id, created_at desc);

alter table public.education_broadcasts enable row level security;

drop policy if exists education_broadcasts_admin_all on public.education_broadcasts;
create policy education_broadcasts_admin_all
  on public.education_broadcasts
  for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
