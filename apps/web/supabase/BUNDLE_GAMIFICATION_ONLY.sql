-- BUNDLE: gamification (таблицы + RLS + справочник бейджей)
-- Supabase → SQL Editor → New query → Run
-- Идемпотентно: можно запускать повторно.

-- ========== 1. Таблицы ==========

create table if not exists public.prisma_achievements (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text not null,
  icon_emoji text not null,
  xp_reward integer not null,
  criteria_type text not null,
  criteria_value integer not null,
  module_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.prisma_user_achievements (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.prisma_achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

create index if not exists idx_prisma_user_achievements_user on public.prisma_user_achievements (user_id);

create table if not exists public.prisma_user_progress (
  id text primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  total_xp integer not null default 0,
  level integer not null default 1,
  streak_days integer not null default 0,
  last_active_date date,
  iota_correct_streak integer not null default 0,
  stats jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.prisma_quiz_results (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id text not null,
  score double precision not null,
  passed boolean not null default false,
  passed_at timestamptz not null default now(),
  metadata jsonb
);

create index if not exists idx_prisma_quiz_results_user_module on public.prisma_quiz_results (user_id, module_id);
create index if not exists idx_prisma_quiz_results_user_passed on public.prisma_quiz_results (user_id, passed_at);

-- ========== 2. RLS (user tables) ==========

alter table public.prisma_user_achievements enable row level security;
alter table public.prisma_user_progress enable row level security;
alter table public.prisma_quiz_results enable row level security;

drop policy if exists achievements_select_own on public.prisma_user_achievements;
create policy achievements_select_own on public.prisma_user_achievements
  for select using (auth.uid() = user_id);

drop policy if exists progress_select_own on public.prisma_user_progress;
create policy progress_select_own on public.prisma_user_progress
  for select using (auth.uid() = user_id);

drop policy if exists quiz_select_own on public.prisma_quiz_results;
create policy quiz_select_own on public.prisma_quiz_results
  for select using (auth.uid() = user_id);

-- ========== 3. RLS hardening (catalog + revoke client writes) ==========

alter table public.prisma_achievements enable row level security;

drop policy if exists prisma_achievements_select on public.prisma_achievements;
create policy prisma_achievements_select on public.prisma_achievements
  for select
  using (true);

revoke insert, update, delete on public.prisma_achievements from anon, authenticated;
revoke insert, update, delete on public.prisma_user_achievements from anon, authenticated;
revoke insert, update, delete on public.prisma_user_progress from anon, authenticated;
revoke insert, update, delete on public.prisma_quiz_results from anon, authenticated;

-- ========== 4. Справочник бейджей ==========

insert into public.prisma_achievements (id, name, slug, description, icon_emoji, xp_reward, criteria_type, criteria_value, module_id)
values
  ('ach_orads_explorer', 'O-RADS Explorer', 'orads-explorer', 'Пройдено 3 учебных кейса по O-RADS US', '⭐', 50, 'CASES_COMPLETED', 3, 'orads'),
  ('ach_iota_pro', 'IOTA Pro', 'iota-pro', '5 правильных интерпретаций IOTA подряд', '⭐⭐', 75, 'CORRECT_STREAK', 5, 'iota'),
  ('ach_ultrasound_student', 'Ученик УЗИ', 'ultrasound-student', 'Изучено 10 учебных материалов', '⭐', 50, 'LESSONS_COMPLETED', 10, 'general'),
  ('ach_patient_streak', 'Терпеливый', 'patient-streak', '7 дней подряд заходите в платформу', '🔥', 100, 'LOGIN_STREAK', 7, null),
  ('ach_fmf_master', 'FMF Мастер', 'fmf-master', '100% прохождение раздела FMF', '🏆', 150, 'MODULE_COMPLETION', 100, 'fmf')
on conflict (slug) do nothing;
