-- Online school upgrade: author profiles, per-lesson progress, lesson metadata

create table if not exists public.author_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  bio text,
  avatar_url text,
  telegram text,
  website text,
  revenue_percent smallint not null default 70 check (revenue_percent >= 0 and revenue_percent <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_author_profiles_user on public.author_profiles (user_id);

alter table public.course_lessons
  add column if not exists description text,
  add column if not exists video_provider text check (
    video_provider is null or video_provider in ('youtube', 'vimeo', 'upload')
  ),
  add column if not exists duration_minutes integer check (duration_minutes is null or duration_minutes > 0);

alter table public.course_enrollments
  add column if not exists payment_id uuid references public.payments (id) on delete set null;

create table if not exists public.course_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists idx_lesson_progress_user_course on public.course_lesson_progress (user_id, course_id);
create index if not exists idx_lesson_progress_lesson on public.course_lesson_progress (lesson_id);

alter table public.author_profiles enable row level security;
alter table public.course_lesson_progress enable row level security;

drop policy if exists author_profiles_select on public.author_profiles;
create policy author_profiles_select on public.author_profiles
  for select using (true);

drop policy if exists author_profiles_own_write on public.author_profiles;
create policy author_profiles_own_write on public.author_profiles
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists lesson_progress_select on public.course_lesson_progress;
create policy lesson_progress_select on public.course_lesson_progress
  for select using (
    user_id = auth.uid()
    or public.can_manage_course(course_id)
  );

drop policy if exists lesson_progress_own_write on public.course_lesson_progress;
create policy lesson_progress_own_write on public.course_lesson_progress
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());
