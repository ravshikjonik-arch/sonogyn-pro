-- SonoGyn Pro · все миграции (порядок по имени файла)
-- Supabase Dashboard → SQL Editor → вставить и Run
-- Сгенерировано: 2026-06-09T06:27:45.590Z

-- ========== 20260207180000_clinical_cases.sql ==========
-- Clinical cases social layer + Supabase Realtime enablement
-- Apply via Supabase SQL editor or `supabase db push`

create extension if not exists "pgcrypto";

create table if not exists public.clinical_cases (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text not null,
  modality text default 'ultrasound',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.clinical_cases (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists case_comments_case_id_idx on public.case_comments (case_id);

create table if not exists public.case_likes (
  case_id uuid not null references public.clinical_cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (case_id, user_id)
);

create table if not exists public.case_bookmarks (
  case_id uuid not null references public.clinical_cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (case_id, user_id)
);

alter table public.clinical_cases enable row level security;
alter table public.case_comments enable row level security;
alter table public.case_likes enable row level security;
alter table public.case_bookmarks enable row level security;

create policy "clinical_cases_select_authenticated" on public.clinical_cases
  for select to authenticated using (true);

create policy "clinical_cases_insert_self" on public.clinical_cases
  for insert to authenticated with check (auth.uid() = author_id);

create policy "clinical_cases_update_owner" on public.clinical_cases
  for update to authenticated using (auth.uid() = author_id);

create policy "clinical_cases_delete_owner" on public.clinical_cases
  for delete to authenticated using (auth.uid() = author_id);

create policy "case_comments_select_authenticated" on public.case_comments
  for select to authenticated using (true);

create policy "case_comments_insert_self" on public.case_comments
  for insert to authenticated with check (auth.uid() = author_id);

create policy "case_likes_rw_self" on public.case_likes
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "case_bookmarks_rw_self" on public.case_bookmarks
  for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Realtime broadcasts (requires replication privileges — run as supabase_admin)
alter publication supabase_realtime add table public.clinical_cases;
alter publication supabase_realtime add table public.case_comments;

-- ========== 20260207190000_calculator_entries.sql ==========
-- Structured calculator payloads per authenticated user (JSON for flexible schemas)

create table if not exists public.calculator_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calculator_code text not null,
  payload jsonb not null default '{}'::jsonb,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists calculator_entries_user_code_idx
  on public.calculator_entries (user_id, calculator_code, created_at desc);

alter table public.calculator_entries enable row level security;

create policy "calculator_entries_select_own" on public.calculator_entries
  for select to authenticated using (auth.uid() = user_id);

create policy "calculator_entries_insert_own" on public.calculator_entries
  for insert to authenticated with check (auth.uid() = user_id);

create policy "calculator_entries_delete_own" on public.calculator_entries
  for delete to authenticated using (auth.uid() = user_id);

-- ========== 20260208100000_saas_platform_core.sql ==========
-- SaaS platform core: profiles (RBAC + billing), teaching cases, AI analyses,
-- calculators catalog, Stripe subscriptions, analytics_events, audit_log.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  full_name text,
  institution text,
  specialization text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro')),
  subscription_expires_at timestamptz,
  stripe_customer_id text unique,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  anatomy text,
  pathology text,
  difficulty text,
  is_public boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'flagged')),
  flag_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_user_idx on public.cases (user_id);
create index if not exists cases_status_public_idx on public.cases (status, is_public);

create table if not exists public.case_media (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video', 'dicom')),
  order_index int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);

create index if not exists case_media_case_idx on public.case_media (case_id);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  results jsonb,
  error_message text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_analyses_case_idx on public.ai_analyses (case_id);
create index if not exists ai_analyses_status_idx on public.ai_analyses (status);

create table if not exists public.calculators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  formula_config jsonb not null default '{}'::jsonb,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calculator_id uuid references public.calculators (id) on delete set null,
  input_values jsonb not null default '{}'::jsonb,
  output_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  timestamp timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, trial_ends_at)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), now() + interval '7 days')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users for each row execute function public.handle_new_user_profile();

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare rid text;
begin
  rid := coalesce(case when tg_op = 'DELETE' then old.id::text else new.id::text end, null);
  insert into public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(), tg_op, tg_table_name, rid,
    case when tg_op in ('UPDATE', 'DELETE') then row_to_json(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then row_to_json(new) else null end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after insert or update or delete on public.profiles
  for each row execute function public.write_audit_log();

drop trigger if exists audit_cases on public.cases;
create trigger audit_cases after insert or update or delete on public.cases
  for each row execute function public.write_audit_log();

drop trigger if exists audit_subscriptions on public.subscriptions;
create trigger audit_subscriptions after insert or update or delete on public.subscriptions
  for each row execute function public.write_audit_log();

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_media enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.calculators enable row level security;
alter table public.saved_results enable row level security;
alter table public.subscriptions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (auth.uid() = id or public.is_admin());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert with check (auth.uid() = id);

drop policy if exists cases_select_policy on public.cases;
create policy cases_select_policy on public.cases for select using (
  public.is_admin() or user_id = auth.uid() or (status = 'published' and is_public = true)
);
drop policy if exists cases_insert_own on public.cases;
create policy cases_insert_own on public.cases for insert with check (user_id = auth.uid());
drop policy if exists cases_update_own on public.cases;
create policy cases_update_own on public.cases for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists cases_delete_own on public.cases;
create policy cases_delete_own on public.cases for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists case_media_select on public.case_media;
create policy case_media_select on public.case_media for select using (
  public.is_admin() or exists (
    select 1 from public.cases c where c.id = case_media.case_id
      and (c.user_id = auth.uid() or (c.status = 'published' and c.is_public = true))
  )
);
drop policy if exists case_media_write on public.case_media;
create policy case_media_write on public.case_media for all using (
  public.is_admin() or exists (select 1 from public.cases c where c.id = case_media.case_id and c.user_id = auth.uid())
) with check (
  public.is_admin() or exists (select 1 from public.cases c where c.id = case_media.case_id and c.user_id = auth.uid())
);

drop policy if exists ai_analyses_select on public.ai_analyses;
create policy ai_analyses_select on public.ai_analyses for select using (
  public.is_admin() or exists (select 1 from public.cases c where c.id = ai_analyses.case_id and c.user_id = auth.uid())
);
drop policy if exists ai_analyses_insert on public.ai_analyses;
create policy ai_analyses_insert on public.ai_analyses for insert with check (
  exists (select 1 from public.cases c where c.id = ai_analyses.case_id and c.user_id = auth.uid()) or public.is_admin()
);
drop policy if exists ai_analyses_update on public.ai_analyses;
create policy ai_analyses_update on public.ai_analyses for update using (
  public.is_admin() or exists (select 1 from public.cases c where c.id = ai_analyses.case_id and c.user_id = auth.uid())
);

drop policy if exists calculators_select on public.calculators;
create policy calculators_select on public.calculators for select to authenticated using (true);
drop policy if exists calculators_write_admin on public.calculators;
create policy calculators_write_admin on public.calculators for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists saved_results_own on public.saved_results;
create policy saved_results_own on public.saved_results for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists subscriptions_own on public.subscriptions;
create policy subscriptions_own on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists analytics_insert on public.analytics_events;
create policy analytics_insert on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists analytics_select_admin on public.analytics_events;
create policy analytics_select_admin on public.analytics_events for select using (public.is_admin() or auth.uid() = user_id);

drop policy if exists audit_select_admin on public.audit_log;
create policy audit_select_admin on public.audit_log for select using (public.is_admin());

comment on table public.cases is 'Teaching gallery — anonymized educational cases only.';

-- ========== 20260210120000_teaching_social_on_cases.sql ==========
-- Social layer for SaaS teaching cases (`public.cases`) — comments, likes, bookmarks.
-- Keeps legacy `clinical_cases` / `case_*` tables untouched for older demos.

create extension if not exists "pgcrypto";

create table if not exists public.teaching_case_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists teaching_case_comments_case_idx on public.teaching_case_comments (case_id);

create table if not exists public.teaching_case_likes (
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (case_id, user_id)
);

create table if not exists public.teaching_case_bookmarks (
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (case_id, user_id)
);

alter table public.teaching_case_comments enable row level security;
alter table public.teaching_case_likes enable row level security;
alter table public.teaching_case_bookmarks enable row level security;

-- Helper: viewer may access teaching row when RLS on cases would allow SELECT.
create or replace function public.can_view_teaching_case(target_case uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.cases c
    where c.id = target_case
      and (
        public.is_admin()
        or c.user_id = auth.uid()
        or (c.status = 'published' and c.is_public = true)
      )
  );
$$;

drop policy if exists teaching_comments_select on public.teaching_case_comments;
create policy teaching_comments_select on public.teaching_case_comments
  for select to authenticated
  using (public.can_view_teaching_case(case_id));

drop policy if exists teaching_comments_insert on public.teaching_case_comments;
create policy teaching_comments_insert on public.teaching_case_comments
  for insert to authenticated
  with check (
    auth.uid() = author_id
    and public.can_view_teaching_case(case_id)
  );

drop policy if exists teaching_likes_rw on public.teaching_case_likes;
create policy teaching_likes_rw on public.teaching_case_likes
  for all to authenticated
  using (
    auth.uid() = user_id
    and public.can_view_teaching_case(case_id)
  )
  with check (
    auth.uid() = user_id
    and public.can_view_teaching_case(case_id)
  );

drop policy if exists teaching_bookmarks_rw on public.teaching_case_bookmarks;
create policy teaching_bookmarks_rw on public.teaching_case_bookmarks
  for all to authenticated
  using (
    auth.uid() = user_id
    and public.can_view_teaching_case(case_id)
  )
  with check (
    auth.uid() = user_id
    and public.can_view_teaching_case(case_id)
  );

comment on table public.teaching_case_comments is 'Threaded discussion for gallery cases (`public.cases`).';

-- Чтобы лента обновлялась через Supabase Realtime, в Dashboard → Database → Replication
-- включите таблицы `cases`, `teaching_case_comments` (и при необходимости likes/bookmarks).

-- ========== 20260506000000_clinical_copilot_schema.sql ==========
-- Clinical Copilot MVP — core entities, audit trail, storage policies.
-- Apply in Supabase SQL Editor or via `supabase db push` after linking the project.
-- PHI: store only what your jurisdiction allows; prefer pseudonymous labels in MVP UI.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Patients (pseudonymous / operational — not a full EMR)
-- ---------------------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  external_ref text,
  display_label text not null default 'Unlabeled',
  meta jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patients_created_by_idx on public.patients (created_by);

-- ---------------------------------------------------------------------------
-- Studies (one ultrasound encounter / order)
-- ---------------------------------------------------------------------------
create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients (id) on delete set null,
  modality text not null default 'ultrasound',
  study_type text not null default 'ob_gyn_general',
  status text not null default 'draft',
  title text,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studies_created_by_idx on public.studies (created_by);
create index if not exists studies_patient_idx on public.studies (patient_id);

-- ---------------------------------------------------------------------------
-- Series (cine stack / anatomical grouping within a study)
-- ---------------------------------------------------------------------------
create table if not exists public.ultrasound_series (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  label text not null default 'Series',
  plane_or_region text,
  sort_order int not null default 0,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ultrasound_series_study_idx on public.ultrasound_series (study_id);

-- ---------------------------------------------------------------------------
-- Images (object stored in Supabase Storage; DB holds metadata)
-- ---------------------------------------------------------------------------
create table if not exists public.ultrasound_images (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null references public.ultrasound_series (id) on delete cascade,
  storage_bucket text not null default 'ultrasound-media',
  storage_path text not null,
  file_name text not null,
  content_type text,
  byte_size bigint,
  frame_index int,
  modality_hint text,
  acquisition_notes text,
  sha256 text,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index if not exists ultrasound_images_series_idx on public.ultrasound_images (series_id);

-- ---------------------------------------------------------------------------
-- Multimodal inputs (reports, labs, notes, voice transcripts, measurement JSON)
-- ---------------------------------------------------------------------------
create table if not exists public.multimodal_documents (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  doc_type text not null,
  storage_bucket text,
  storage_path text,
  body text,
  structured_payload jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists multimodal_documents_study_idx on public.multimodal_documents (study_id);

-- ---------------------------------------------------------------------------
-- Measurements (structured biometry, CRL/BPD/etc. as JSON until normalized)
-- ---------------------------------------------------------------------------
create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  image_id uuid references public.ultrasound_images (id) on delete set null,
  kind text not null default 'structured',
  payload jsonb not null default '{}'::jsonb,
  source text not null default 'manual',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists measurements_study_idx on public.measurements (study_id);

-- ---------------------------------------------------------------------------
-- AI findings (per agent; versioned payloads)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_findings (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  image_id uuid references public.ultrasound_images (id) on delete set null,
  agent_name text not null,
  model_id text,
  status text not null default 'suggestion',
  confidence numeric,
  payload jsonb not null default '{}'::jsonb,
  citations jsonb not null default '[]'::jsonb,
  safety_notes text,
  created_at timestamptz not null default now()
);

create index if not exists ai_findings_study_idx on public.ai_findings (study_id);
create index if not exists ai_findings_agent_idx on public.ai_findings (agent_name);

-- ---------------------------------------------------------------------------
-- Reports (editable structured output)
-- ---------------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  template_key text not null default 'ob_gyn_ultrasound_v1',
  locale text not null default 'ru',
  status text not null default 'draft',
  body jsonb not null default '{}'::jsonb,
  plain_text text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reports_study_idx on public.reports (study_id);

-- ---------------------------------------------------------------------------
-- Image annotations (geometry + labels for PACS-like overlays)
-- ---------------------------------------------------------------------------
create table if not exists public.annotations (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.ultrasound_images (id) on delete cascade,
  label text,
  geom jsonb not null default '{}'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists annotations_image_idx on public.annotations (image_id);

-- ---------------------------------------------------------------------------
-- Audit log (append-only operational trail)
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  study_id uuid references public.studies (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_study_idx on public.audit_logs (study_id);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.patients enable row level security;
alter table public.studies enable row level security;
alter table public.ultrasound_series enable row level security;
alter table public.ultrasound_images enable row level security;
alter table public.multimodal_documents enable row level security;
alter table public.measurements enable row level security;
alter table public.ai_findings enable row level security;
alter table public.reports enable row level security;
alter table public.annotations enable row level security;
alter table public.audit_logs enable row level security;

-- Patients
create policy "patients_select_own"
  on public.patients for select
  using (created_by = auth.uid());

create policy "patients_insert_own"
  on public.patients for insert
  with check (created_by = auth.uid());

create policy "patients_update_own"
  on public.patients for update
  using (created_by = auth.uid());

create policy "patients_delete_own"
  on public.patients for delete
  using (created_by = auth.uid());

-- Studies
create policy "studies_select_own"
  on public.studies for select
  using (created_by = auth.uid());

create policy "studies_insert_own"
  on public.studies for insert
  with check (created_by = auth.uid());

create policy "studies_update_own"
  on public.studies for update
  using (created_by = auth.uid());

create policy "studies_delete_own"
  on public.studies for delete
  using (created_by = auth.uid());

-- Series
create policy "series_select_own"
  on public.ultrasound_series for select
  using (created_by = auth.uid());

create policy "series_insert_own"
  on public.ultrasound_series for insert
  with check (created_by = auth.uid());

create policy "series_update_own"
  on public.ultrasound_series for update
  using (created_by = auth.uid());

create policy "series_delete_own"
  on public.ultrasound_series for delete
  using (created_by = auth.uid());

-- Images
create policy "images_select_own"
  on public.ultrasound_images for select
  using (created_by = auth.uid());

create policy "images_insert_own"
  on public.ultrasound_images for insert
  with check (created_by = auth.uid());

create policy "images_update_own"
  on public.ultrasound_images for update
  using (created_by = auth.uid());

create policy "images_delete_own"
  on public.ultrasound_images for delete
  using (created_by = auth.uid());

-- Multimodal documents
create policy "multimodal_select_own"
  on public.multimodal_documents for select
  using (created_by = auth.uid());

create policy "multimodal_insert_own"
  on public.multimodal_documents for insert
  with check (created_by = auth.uid());

create policy "multimodal_update_own"
  on public.multimodal_documents for update
  using (created_by = auth.uid());

create policy "multimodal_delete_own"
  on public.multimodal_documents for delete
  using (created_by = auth.uid());

-- Measurements
create policy "measurements_select_own_study"
  on public.measurements for select
  using (
    exists (
      select 1 from public.studies s
      where s.id = measurements.study_id and s.created_by = auth.uid()
    )
  );

create policy "measurements_insert_own_study"
  on public.measurements for insert
  with check (
    exists (
      select 1 from public.studies s
      where s.id = measurements.study_id and s.created_by = auth.uid()
    )
  );

create policy "measurements_update_own_study"
  on public.measurements for update
  using (
    exists (
      select 1 from public.studies s
      where s.id = measurements.study_id and s.created_by = auth.uid()
    )
  );

create policy "measurements_delete_own_study"
  on public.measurements for delete
  using (
    exists (
      select 1 from public.studies s
      where s.id = measurements.study_id and s.created_by = auth.uid()
    )
  );

-- AI findings — readable by study owner; inserts via service role or trusted edge functions later
create policy "ai_findings_select_own_study"
  on public.ai_findings for select
  using (
    exists (
      select 1 from public.studies s
      where s.id = ai_findings.study_id and s.created_by = auth.uid()
    )
  );

create policy "ai_findings_insert_own_study"
  on public.ai_findings for insert
  with check (
    exists (
      select 1 from public.studies s
      where s.id = ai_findings.study_id and s.created_by = auth.uid()
    )
  );

create policy "ai_findings_update_own_study"
  on public.ai_findings for update
  using (
    exists (
      select 1 from public.studies s
      where s.id = ai_findings.study_id and s.created_by = auth.uid()
    )
  );

create policy "ai_findings_delete_own_study"
  on public.ai_findings for delete
  using (
    exists (
      select 1 from public.studies s
      where s.id = ai_findings.study_id and s.created_by = auth.uid()
    )
  );

-- Reports
create policy "reports_select_own_study"
  on public.reports for select
  using (
    exists (
      select 1 from public.studies s
      where s.id = reports.study_id and s.created_by = auth.uid()
    )
  );

create policy "reports_insert_own_study"
  on public.reports for insert
  with check (
    exists (
      select 1 from public.studies s
      where s.id = reports.study_id and s.created_by = auth.uid()
    )
  );

create policy "reports_update_own_study"
  on public.reports for update
  using (
    exists (
      select 1 from public.studies s
      where s.id = reports.study_id and s.created_by = auth.uid()
    )
  );

create policy "reports_delete_own_study"
  on public.reports for delete
  using (
    exists (
      select 1 from public.studies s
      where s.id = reports.study_id and s.created_by = auth.uid()
    )
  );

-- Annotations
create policy "annotations_select_own_image"
  on public.annotations for select
  using (
    exists (
      select 1
      from public.ultrasound_images i
      join public.ultrasound_series ser on ser.id = i.series_id
      join public.studies st on st.id = ser.study_id
      where i.id = annotations.image_id and st.created_by = auth.uid()
    )
  );

create policy "annotations_mutate_own_image"
  on public.annotations for all
  using (
    exists (
      select 1
      from public.ultrasound_images i
      join public.ultrasound_series ser on ser.id = i.series_id
      join public.studies st on st.id = ser.study_id
      where i.id = annotations.image_id and st.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.ultrasound_images i
      join public.ultrasound_series ser on ser.id = i.series_id
      join public.studies st on st.id = ser.study_id
      where i.id = annotations.image_id and st.created_by = auth.uid()
    )
  );

-- Audit logs: users can insert their own events; read own rows
create policy "audit_logs_select_own"
  on public.audit_logs for select
  using (actor_id = auth.uid());

create policy "audit_logs_insert_self"
  on public.audit_logs for insert
  with check (actor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket + policies (private clinical media)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('ultrasound-media', 'ultrasound-media', false)
on conflict (id) do nothing;

-- Path convention: {user_id}/{study_id}/{series_id}/{uuid}_{filename}
create policy "ultrasound_media_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ultrasound-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ultrasound_media_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'ultrasound-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ultrasound_media_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'ultrasound-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "ultrasound_media_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'ultrasound-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ========== 20260506200000_medical_users_avatar_storage.sql ==========
-- Doctor profile row in public.users (1:1 with auth.users).
-- RBAC / billing remains on public.profiles; clinical-facing identity fields sync here.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  specialization text,
  institution text,
  avatar_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

alter table public.users enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users for select using (auth.uid() = id or public.is_admin());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update using (auth.uid() = id or public.is_admin());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users for insert with check (auth.uid() = id);

-- Extend signup trigger: profiles (RBAC) + users (doctor-facing row)
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  fn text := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''), '');
  sp text := nullif(trim(coalesce(new.raw_user_meta_data->>'specialization', '')), '');
  ins text := nullif(trim(coalesce(new.raw_user_meta_data->>'institution', '')), '');
begin
  insert into public.profiles (id, full_name, specialization, institution, trial_ends_at)
  values (new.id, fn, sp, ins, now() + interval '7 days')
  on conflict (id) do nothing;

  insert into public.users (id, email, full_name, specialization, institution)
  values (
    new.id,
    coalesce(new.email, ''),
    fn,
    sp,
    ins
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.users.full_name end,
    specialization = coalesce(excluded.specialization, public.users.specialization),
    institution = coalesce(excluded.institution, public.users.institution),
    updated_at = now();

  return new;
end;
$$;

-- Backfill from auth + profiles for existing accounts
insert into public.users (id, email, full_name, specialization, institution)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(nullif(trim(p.full_name), ''), ''),
  p.specialization,
  p.institution
from auth.users u
left join public.profiles p on p.id = u.id
on conflict (id) do nothing;

-- Private avatars: path convention {user_id}/avatar
insert into storage.buckets (id, name, public)
values ('clinical-avatars', 'clinical-avatars', false)
on conflict (id) do nothing;

drop policy if exists clinical_avatars_select_own on storage.objects;
create policy clinical_avatars_select_own on storage.objects for select to authenticated using (
  bucket_id = 'clinical-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists clinical_avatars_insert_own on storage.objects;
create policy clinical_avatars_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'clinical-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists clinical_avatars_update_own on storage.objects;
create policy clinical_avatars_update_own on storage.objects for update to authenticated using (
  bucket_id = 'clinical-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists clinical_avatars_delete_own on storage.objects;
create policy clinical_avatars_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'clinical-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

comment on table public.users is 'Physician profile (app-facing); synced with auth signup metadata and PATCH /api/profile.';

-- ========== 20260605120000_teaching_case_media_storage.sql ==========
-- Storage for teaching case ultrasound images/videos (anonymized, no PHI in production policy).

insert into storage.buckets (id, name, public)
values ('teaching-case-media', 'teaching-case-media', false)
on conflict (id) do nothing;

drop policy if exists teaching_case_media_select on storage.objects;
create policy teaching_case_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'teaching-case-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.cases c
        where c.id::text = (storage.foldername(name))[2]
          and c.status = 'published'
          and c.is_public = true
      )
    )
  );

drop policy if exists teaching_case_media_insert on storage.objects;
create policy teaching_case_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'teaching-case-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.cases c
      where c.id::text = (storage.foldername(name))[2]
        and c.user_id = auth.uid()
    )
  );

drop policy if exists teaching_case_media_delete on storage.objects;
create policy teaching_case_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'teaching-case-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on table public.case_media is 'Media attachments for teaching cases — paths in bucket teaching-case-media.';

-- ========== 20260605130000_doctor_chat.sql ==========
-- Doctors community chat: topic channels + messages with optional media.
-- Case thread comments: optional media per message.

create table if not exists public.doctor_chat_channels (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.doctor_chat_channels (id, slug, title, description, sort_order)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'general',
    'Общий чат',
    'Вопросы, мысли, обмен опытом — без PHI.',
    0
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'gynecology',
    'Гинекология · УЗИ',
    'Яичники, матка, O-RADS, эндометриоз, МЖ.',
    1
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'obstetrics',
    'Акушерство · УЗИ',
    'Беременность, скрининги, FMF, допплер.',
    2
  )
on conflict (id) do nothing;

create table if not exists public.doctor_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.doctor_chat_channels (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text,
  media_storage_path text,
  media_type text check (media_type is null or media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  constraint doctor_chat_messages_content check (
    (body is not null and length(trim(body)) > 0)
    or media_storage_path is not null
  )
);

create index if not exists doctor_chat_messages_channel_idx
  on public.doctor_chat_messages (channel_id, created_at desc);

alter table public.doctor_chat_channels enable row level security;
alter table public.doctor_chat_messages enable row level security;

drop policy if exists doctor_chat_channels_select on public.doctor_chat_channels;
create policy doctor_chat_channels_select on public.doctor_chat_channels
  for select to authenticated
  using (true);

drop policy if exists doctor_chat_messages_select on public.doctor_chat_messages;
create policy doctor_chat_messages_select on public.doctor_chat_messages
  for select to authenticated
  using (true);

drop policy if exists doctor_chat_messages_insert on public.doctor_chat_messages;
create policy doctor_chat_messages_insert on public.doctor_chat_messages
  for insert to authenticated
  with check (author_id = auth.uid());

-- Media in case discussion threads
alter table public.teaching_case_comments
  add column if not exists media_storage_path text,
  add column if not exists media_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teaching_case_comments_media_type_check'
  ) then
    alter table public.teaching_case_comments
      add constraint teaching_case_comments_media_type_check
      check (media_type is null or media_type in ('image', 'video'));
  end if;
end $$;

-- Bucket for chat attachments (general + inline case messages)
insert into storage.buckets (id, name, public)
values ('doctor-chat-media', 'doctor-chat-media', false)
on conflict (id) do nothing;

drop policy if exists doctor_chat_media_select on storage.objects;
create policy doctor_chat_media_select on storage.objects
  for select to authenticated
  using (bucket_id = 'doctor-chat-media');

drop policy if exists doctor_chat_media_insert on storage.objects;
create policy doctor_chat_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'doctor-chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists doctor_chat_media_delete on storage.objects;
create policy doctor_chat_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'doctor-chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on table public.doctor_chat_channels is 'Topic channels for doctors community chat.';
comment on table public.doctor_chat_messages is 'Messages in doctor chat channels; optional ultrasound image/video.';

-- ========== 20260605140000_community_realtime.sql ==========
-- Realtime для чата врачей и ленты кейсов (idempotent).

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cases'
  ) then
    alter publication supabase_realtime add table public.cases;
  end if;
end $migration$;

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teaching_case_comments'
  ) then
    alter publication supabase_realtime add table public.teaching_case_comments;
  end if;
end $migration$;

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'doctor_chat_messages'
  ) then
    alter publication supabase_realtime add table public.doctor_chat_messages;
  end if;
end $migration$;

-- ========== 20260605200000_doctor_presence.sql ==========
-- Online / offline roster for doctors community chat.

create table if not exists public.doctor_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Врач',
  status text not null default 'offline' check (status in ('online', 'offline')),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doctor_presence_status_idx
  on public.doctor_presence (status, last_seen_at desc);

alter table public.doctor_presence enable row level security;

drop policy if exists doctor_presence_select on public.doctor_presence;
create policy doctor_presence_select on public.doctor_presence
  for select to authenticated
  using (true);

drop policy if exists doctor_presence_upsert_self on public.doctor_presence;
create policy doctor_presence_upsert_self on public.doctor_presence
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Roster names: authenticated users may read peers' id + full_name for presence UI.
drop policy if exists profiles_select_roster on public.profiles;
create policy profiles_select_roster on public.profiles
  for select to authenticated
  using (true);

comment on table public.doctor_presence is 'Heartbeat-based online/offline for doctors community.';

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'doctor_presence'
  ) then
    alter publication supabase_realtime add table public.doctor_presence;
  end if;
end $migration$;

-- ========== 20260608120000_security_hardening.sql ==========
-- Security hardening (safe: skips sections if tables not created yet).
-- Run anytime. After clinical_copilot migration, re-run to apply series/images policies.

-- ========== profiles (only if table exists) ==========
do $security$
begin
  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists profiles_select_roster on public.profiles';

    execute $fn$
      create or replace function public.get_doctor_display_names(p_user_ids uuid[])
      returns table (id uuid, full_name text)
      language sql
      security definer
      set search_path = public
      stable
      as $body$
        select p.id, coalesce(nullif(trim(p.full_name), ''), 'Врач') as full_name
        from public.profiles p
        where p.id = any (p_user_ids)
          and auth.uid() is not null;
      $body$;
    $fn$;

    execute 'revoke all on function public.get_doctor_display_names(uuid[]) from public';
    execute 'grant execute on function public.get_doctor_display_names(uuid[]) to authenticated';
  end if;
end
$security$;

-- ========== copilot series/images (only if tables exist) ==========
do $security$
begin
  if to_regclass('public.ultrasound_series') is not null then
    execute 'drop policy if exists series_select_own on public.ultrasound_series';
    execute 'drop policy if exists series_insert_own on public.ultrasound_series';
    execute 'drop policy if exists series_update_own on public.ultrasound_series';
    execute 'drop policy if exists series_delete_own on public.ultrasound_series';
    execute 'drop policy if exists series_select_own_study on public.ultrasound_series';
    execute 'drop policy if exists series_insert_own_study on public.ultrasound_series';
    execute 'drop policy if exists series_update_own_study on public.ultrasound_series';
    execute 'drop policy if exists series_delete_own_study on public.ultrasound_series';

    execute $pol$
      create policy series_select_own_study on public.ultrasound_series
        for select to authenticated
        using (
          exists (
            select 1 from public.studies s
            where s.id = ultrasound_series.study_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy series_insert_own_study on public.ultrasound_series
        for insert to authenticated
        with check (
          created_by = auth.uid()
          and exists (
            select 1 from public.studies s
            where s.id = study_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy series_update_own_study on public.ultrasound_series
        for update to authenticated
        using (
          exists (
            select 1 from public.studies s
            where s.id = ultrasound_series.study_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy series_delete_own_study on public.ultrasound_series
        for delete to authenticated
        using (
          exists (
            select 1 from public.studies s
            where s.id = ultrasound_series.study_id and s.created_by = auth.uid()
          )
        )
    $pol$;
  end if;

  if to_regclass('public.ultrasound_images') is not null then
    execute 'drop policy if exists images_select_own on public.ultrasound_images';
    execute 'drop policy if exists images_insert_own on public.ultrasound_images';
    execute 'drop policy if exists images_update_own on public.ultrasound_images';
    execute 'drop policy if exists images_delete_own on public.ultrasound_images';
    execute 'drop policy if exists images_select_own_study on public.ultrasound_images';
    execute 'drop policy if exists images_insert_own_study on public.ultrasound_images';
    execute 'drop policy if exists images_update_own_study on public.ultrasound_images';
    execute 'drop policy if exists images_delete_own_study on public.ultrasound_images';

    execute $pol$
      create policy images_select_own_study on public.ultrasound_images
        for select to authenticated
        using (
          exists (
            select 1
            from public.ultrasound_series ser
            join public.studies s on s.id = ser.study_id
            where ser.id = ultrasound_images.series_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy images_insert_own_study on public.ultrasound_images
        for insert to authenticated
        with check (
          created_by = auth.uid()
          and exists (
            select 1
            from public.ultrasound_series ser
            join public.studies s on s.id = ser.study_id
            where ser.id = series_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy images_update_own_study on public.ultrasound_images
        for update to authenticated
        using (
          exists (
            select 1
            from public.ultrasound_series ser
            join public.studies s on s.id = ser.study_id
            where ser.id = ultrasound_images.series_id and s.created_by = auth.uid()
          )
        )
    $pol$;

    execute $pol$
      create policy images_delete_own_study on public.ultrasound_images
        for delete to authenticated
        using (
          exists (
            select 1
            from public.ultrasound_series ser
            join public.studies s on s.id = ser.study_id
            where ser.id = ultrasound_images.series_id and s.created_by = auth.uid()
          )
        )
    $pol$;
  end if;
end
$security$;

-- ========== doctor chat media (only if chat table exists) ==========
do $security$
begin
  if to_regclass('public.doctor_chat_messages') is not null then
    execute 'drop policy if exists doctor_chat_media_select on storage.objects';
    execute $pol$
      create policy doctor_chat_media_select on storage.objects
        for select to authenticated
        using (
          bucket_id = 'doctor-chat-media'
          and (
            (storage.foldername(name))[1] = auth.uid()::text
            or exists (
              select 1 from public.doctor_chat_messages m
              where m.media_storage_path = name
            )
          )
        )
    $pol$;
  end if;
end
$security$;
