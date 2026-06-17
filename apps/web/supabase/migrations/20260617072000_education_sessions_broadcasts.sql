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
