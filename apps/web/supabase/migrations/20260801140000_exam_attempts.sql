-- Phase 2 · T2.2 — exam_attempts + RLS (self-assessment progress sync)
-- Persona: студент / самопроверка. No PHI — only quiz answer marks.
-- Mirror of packages/database/supabase/migrations/20260801140000_exam_attempts.sql

create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  blueprint_id text not null,
  mode text not null default 'self_assessment'
    check (mode in ('self_assessment', 'quick', 'certification', 'mock')),
  level text check (level is null or level in ('student', 'doctor')),
  answers jsonb not null default '{}'::jsonb,
  score numeric(5, 2),
  total_questions integer,
  correct_count integer,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint exam_attempts_blueprint_id_len check (char_length(blueprint_id) between 1 and 200),
  constraint exam_attempts_score_range check (score is null or (score >= 0 and score <= 100)),
  constraint exam_attempts_total_nonneg check (total_questions is null or total_questions >= 0),
  constraint exam_attempts_correct_nonneg check (correct_count is null or correct_count >= 0),
  unique (user_id, blueprint_id, mode)
);

create index if not exists exam_attempts_user_updated_idx
  on public.exam_attempts (user_id, updated_at desc);

create index if not exists exam_attempts_blueprint_idx
  on public.exam_attempts (blueprint_id);

comment on table public.exam_attempts is
  'Quiz / exam progress per user. answers = { questionId: correct|incorrect }. No patient PHI.';

alter table public.exam_attempts enable row level security;

drop policy if exists exam_attempts_select_own on public.exam_attempts;
create policy exam_attempts_select_own on public.exam_attempts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists exam_attempts_insert_own on public.exam_attempts;
create policy exam_attempts_insert_own on public.exam_attempts
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists exam_attempts_update_own on public.exam_attempts;
create policy exam_attempts_update_own on public.exam_attempts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists exam_attempts_delete_own on public.exam_attempts;
create policy exam_attempts_delete_own on public.exam_attempts
  for delete to authenticated using (auth.uid() = user_id);

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    execute $pol$
      drop policy if exists exam_attempts_admin_select on public.exam_attempts;
      create policy exam_attempts_admin_select on public.exam_attempts
        for select to authenticated using (public.is_admin());
    $pol$;
  end if;
end $$;
