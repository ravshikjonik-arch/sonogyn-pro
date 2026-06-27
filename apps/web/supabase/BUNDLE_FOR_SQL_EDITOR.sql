-- SonoGyn Pro · все миграции (порядок по имени файла)
-- Supabase Dashboard → SQL Editor → вставить и Run
-- Сгенерировано: 2026-06-27T14:32:10.624Z

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

-- ========== 20260614120000_user_metadata_lookup.sql ==========
-- Быстрый lookup email → user id (замена auth.admin.listUsers в sign-up).
-- Синхронизация из auth.users через trigger.

CREATE TABLE IF NOT EXISTS public.user_metadata (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  full_name TEXT,
  specialty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_metadata_email ON public.user_metadata(email);
CREATE INDEX IF NOT EXISTS idx_user_metadata_phone ON public.user_metadata(phone);

ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- Только service role / backend (RLS без policies для anon/authenticated).
REVOKE ALL ON public.user_metadata FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_metadata TO service_role;

CREATE OR REPLACE FUNCTION public.handle_auth_user_metadata_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR trim(NEW.email) = '' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_metadata (id, email, phone, full_name, specialty, updated_at)
  VALUES (
    NEW.id,
    lower(trim(NEW.email)),
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'specialization', NEW.raw_user_meta_data->>'specialty', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name,
    specialty = EXCLUDED.specialty,
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_metadata_sync ON auth.users;
CREATE TRIGGER on_auth_user_metadata_sync
  AFTER INSERT OR UPDATE OF email, phone, raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_metadata_sync();

-- Backfill существующих пользователей (идемпотентно).
INSERT INTO public.user_metadata (id, email, phone, full_name, specialty, updated_at)
SELECT
  u.id,
  lower(trim(u.email)),
  u.phone,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'specialization', u.raw_user_meta_data->>'specialty', ''),
  NOW()
FROM auth.users u
WHERE u.email IS NOT NULL AND trim(u.email) <> ''
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  full_name = EXCLUDED.full_name,
  specialty = EXCLUDED.specialty,
  updated_at = NOW();

-- ========== 20260616120000_profile_birth_year.sql ==========
-- Год рождения врача (обязательное поле при регистрации / dev-login).

alter table public.profiles
  add column if not exists birth_year smallint
  check (birth_year is null or (birth_year >= 1900 and birth_year <= 2100));

alter table public.users
  add column if not exists birth_year smallint
  check (birth_year is null or (birth_year >= 1900 and birth_year <= 2100));

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  fn text := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''), '');
  sp text := nullif(trim(coalesce(new.raw_user_meta_data->>'specialization', '')), '');
  ins text := nullif(trim(coalesce(new.raw_user_meta_data->>'institution', '')), '');
  by_raw text := nullif(trim(coalesce(new.raw_user_meta_data->>'birth_year', '')), '');
  by_val smallint := null;
begin
  if by_raw ~ '^\d{4}$' then
    by_val := by_raw::smallint;
  end if;

  insert into public.profiles (id, full_name, specialization, institution, birth_year, trial_ends_at)
  values (new.id, fn, sp, ins, by_val, now() + interval '7 days')
  on conflict (id) do nothing;

  insert into public.users (id, email, full_name, specialization, institution, birth_year)
  values (
    new.id,
    coalesce(new.email, ''),
    fn,
    sp,
    ins,
    by_val
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.users.full_name end,
    specialization = coalesce(excluded.specialization, public.users.specialization),
    institution = coalesce(excluded.institution, public.users.institution),
    birth_year = coalesce(excluded.birth_year, public.users.birth_year),
    updated_at = now();

  return new;
end;
$$;

-- ========== 20260617130000_profile_clinical_preferences.sql ==========
-- Клинические настройки врача (шаблоны протоколов и др.) — синхронизация между устройствами.

alter table public.profiles
  add column if not exists clinical_preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.clinical_preferences is
  'Doctor UI prefs: fmfSecondThirdProtocolTemplate (yakubov-2023 | sonogyn-compact), etc.';

-- ========== 20260617140000_yookassa_payments.sql ==========
-- ЮKassa payments (РФ billing). Server writes via service role only.

create table if not exists public.yookassa_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  yookassa_id text not null unique,
  amount_rub numeric(12, 2) not null,
  status text not null default 'pending',
  description text,
  confirmation_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists yookassa_payments_user_id_idx on public.yookassa_payments (user_id);
create index if not exists yookassa_payments_status_idx on public.yookassa_payments (status);

alter table public.yookassa_payments enable row level security;

drop policy if exists "yookassa_payments_select_own" on public.yookassa_payments;
create policy "yookassa_payments_select_own"
  on public.yookassa_payments
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ========== 20260619130000_payments.sql ==========
-- Payments (ЮKassa). Таблица orders/payments для webhook.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'yookassa_payments'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'payments'
  ) then
    alter table public.yookassa_payments rename to payments;
    alter table public.payments rename column amount_rub to amount;
    alter index if exists yookassa_payments_user_id_idx rename to payments_user_id_idx;
    alter index if exists yookassa_payments_status_idx rename to payments_status_idx;
  elsif not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'payments'
  ) then
    create table public.payments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      yookassa_id text not null unique,
      amount numeric(12, 2) not null,
      status text not null default 'pending',
      description text,
      confirmation_url text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
    create index payments_user_id_idx on public.payments (user_id);
    create index payments_status_idx on public.payments (status);
  end if;
end $$;

alter table public.payments enable row level security;

drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments
  for select
  to authenticated
  using (auth.uid() = user_id);

-- ========== 20260620120000_course_author_lms.sql ==========
-- LMS: courses, modules, lessons, enrollments, sales, author role

-- Роль author для создателей курсов
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'moderator', 'admin', 'author'));

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  description_html text not null default '',
  cover_storage_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  price_rub integer not null default 0 check (price_rub >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_author_id on public.courses (author_id);
create index if not exists idx_courses_status on public.courses (status);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_modules_course_sort on public.course_modules (course_id, sort_order);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid not null references public.course_modules (id) on delete cascade,
  title text not null default '',
  body_html text not null default '',
  lesson_type text not null default 'video' check (lesson_type in ('video', 'offline')),
  video_url text,
  video_storage_path text,
  offline_starts_at timestamptz,
  offline_address text,
  offline_stream_url text,
  max_seats integer check (max_seats is null or max_seats > 0),
  is_free_preview boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_lessons_module_sort on public.course_lessons (module_id, sort_order);
create index if not exists idx_course_lessons_course on public.course_lessons (course_id);
create index if not exists idx_course_lessons_offline on public.course_lessons (offline_starts_at)
  where lesson_type = 'offline';

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  progress_percent smallint not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  enrolled_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create index if not exists idx_course_enrollments_course on public.course_enrollments (course_id);
create index if not exists idx_course_enrollments_user on public.course_enrollments (user_id);

create table if not exists public.offline_lesson_registrations (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  registered_at timestamptz not null default now(),
  status text not null default 'registered' check (status in ('registered', 'cancelled', 'attended')),
  unique (lesson_id, user_id)
);

create index if not exists idx_offline_regs_lesson on public.offline_lesson_registrations (lesson_id, registered_at desc);
create index if not exists idx_offline_regs_course on public.offline_lesson_registrations (course_id);

create table if not exists public.course_sales (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  buyer_id uuid references auth.users (id) on delete set null,
  amount_rub integer not null check (amount_rub >= 0),
  sold_at timestamptz not null default now(),
  payment_ref text
);

create index if not exists idx_course_sales_author_sold on public.course_sales (author_id, sold_at desc);
create index if not exists idx_course_sales_course on public.course_sales (course_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_author_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('author', 'admin')
  );
$$;

create or replace function public.is_course_owner(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and c.author_id = auth.uid()
  );
$$;

create or replace function public.can_manage_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_course_owner(p_course_id)
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.offline_lesson_registrations enable row level security;
alter table public.course_sales enable row level security;

-- courses
drop policy if exists courses_select_published on public.courses;
create policy courses_select_published on public.courses
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists courses_author_write on public.courses;
create policy courses_author_write on public.courses
  for all using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists courses_admin_all on public.courses;
create policy courses_admin_all on public.courses
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- modules
drop policy if exists course_modules_manage on public.course_modules;
create policy course_modules_manage on public.course_modules
  for all using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists course_modules_select_enrolled on public.course_modules;
create policy course_modules_select_enrolled on public.course_modules
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (c.status = 'published' or c.author_id = auth.uid())
    )
  );

-- lessons
drop policy if exists course_lessons_manage on public.course_lessons;
create policy course_lessons_manage on public.course_lessons
  for all using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists course_lessons_select on public.course_lessons;
create policy course_lessons_select on public.course_lessons
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (c.status = 'published' or c.author_id = auth.uid())
    )
  );

-- enrollments
drop policy if exists course_enrollments_select on public.course_enrollments;
create policy course_enrollments_select on public.course_enrollments
  for select using (
    user_id = auth.uid()
    or public.can_manage_course(course_id)
  );

drop policy if exists course_enrollments_insert on public.course_enrollments;
create policy course_enrollments_insert on public.course_enrollments
  for insert with check (user_id = auth.uid());

drop policy if exists course_enrollments_update on public.course_enrollments;
create policy course_enrollments_update on public.course_enrollments
  for update using (user_id = auth.uid() or public.can_manage_course(course_id));

-- offline registrations
drop policy if exists offline_regs_select on public.offline_lesson_registrations;
create policy offline_regs_select on public.offline_lesson_registrations
  for select using (
    user_id = auth.uid()
    or public.can_manage_course(course_id)
  );

drop policy if exists offline_regs_insert on public.offline_lesson_registrations;
create policy offline_regs_insert on public.offline_lesson_registrations
  for insert with check (user_id = auth.uid());

-- sales
drop policy if exists course_sales_author on public.course_sales;
create policy course_sales_author on public.course_sales
  for select using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists course_sales_insert_service on public.course_sales;
create policy course_sales_insert_service on public.course_sales
  for insert with check (author_id = auth.uid() or public.is_author_or_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket course-media
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-media',
  'course-media',
  false,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']::text[]
)
on conflict (id) do nothing;

drop policy if exists course_media_owner_rw on storage.objects;
create policy course_media_owner_rw on storage.objects
  for all using (
    bucket_id = 'course-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'course-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists course_media_admin on storage.objects;
create policy course_media_admin on storage.objects
  for all using (
    bucket_id = 'course-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ========== 20260621120000_lesson_video_storage.sql ==========
-- Video upload fields for S3/Yandex Object Storage + HLS

alter table public.course_lessons
  add column if not exists video_file_key text,
  add column if not exists video_file_url text,
  add column if not exists hls_playlist_key text,
  add column if not exists video_processing_status text not null default 'none'
    check (video_processing_status in ('none', 'uploading', 'processing', 'ready', 'failed')),
  add column if not exists video_mime_type text,
  add column if not exists video_size_bytes bigint check (video_size_bytes is null or video_size_bytes >= 0),
  add column if not exists video_upload_error text;

create index if not exists idx_course_lessons_video_status
  on public.course_lessons (video_processing_status)
  where lesson_type = 'video';

-- ========== 20260622120000_lms_school_upgrade.sql ==========
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

-- ========== 20260623120000_structured_reports.sql ==========
-- Structured Reporting Engine (SRE) — templates, drafts, citation links.
-- Phase 1 · T1.3

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- report_templates (read-mostly catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  domain text not null,
  version text not null,
  locales text[] not null default '{ru}',
  schema_json jsonb not null default '{}'::jsonb,
  engine_id text not null,
  title_key text,
  description_key text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint report_templates_domain_check
    check (domain in ('adnex', 'thyroid', 'obstetric', 'breast', 'generic'))
);

create index if not exists report_templates_domain_active_idx
  on public.report_templates (domain, is_active)
  where is_active = true;

-- Seed: adnex-orads-v1 (stable id for cross-env references)
insert into public.report_templates (
  id,
  slug,
  domain,
  version,
  locales,
  schema_json,
  engine_id,
  title_key,
  description_key,
  is_active
)
values (
  '00000000-0000-4000-8000-000000000001',
  'adnex-orads-v1',
  'adnex',
  '1.0.0',
  '{ru}',
  '{
    "fields": [
      {"id": "menopause", "type": "enum", "labelKey": "field.menopause", "required": true, "group": "context"},
      {"id": "localization", "type": "enum", "labelKey": "field.localization", "required": true, "group": "context"},
      {"id": "structure", "type": "enum", "labelKey": "field.structure", "required": false, "group": "morphology"},
      {"id": "lengthMm", "type": "measurement_mm", "labelKey": "field.length_mm", "required": false, "group": "measurements"},
      {"id": "widthMm", "type": "measurement_mm", "labelKey": "field.width_mm", "required": false, "group": "measurements"},
      {"id": "heightMm", "type": "measurement_mm", "labelKey": "field.height_mm", "required": false, "group": "measurements"},
      {"id": "oradsCategory", "type": "orads_category", "labelKey": "field.orads_category", "required": false, "group": "classification"},
      {"id": "iotaColorScore", "type": "iota_color_score", "labelKey": "field.iota_color_score", "required": false, "group": "classification"},
      {"id": "freeTextFindings", "type": "text", "labelKey": "field.free_text", "required": false, "group": "free_text"}
    ]
  }'::jsonb,
  'sre-adnex-v1',
  'template.adnex_orads_v1.title',
  'template.adnex_orads_v1.description',
  true
)
on conflict (slug) do update set
  domain = excluded.domain,
  version = excluded.version,
  locales = excluded.locales,
  schema_json = excluded.schema_json,
  engine_id = excluded.engine_id,
  title_key = excluded.title_key,
  description_key = excluded.description_key,
  is_active = excluded.is_active,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- structured_reports (user drafts / finalized)
-- ---------------------------------------------------------------------------
create table if not exists public.structured_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  study_id uuid references public.studies (id) on delete set null,
  template_id uuid not null references public.report_templates (id),
  status text not null default 'draft'
    check (status in ('draft', 'edited', 'finalized', 'archived')),
  input_json jsonb not null default '{}'::jsonb,
  output_json jsonb not null default '{}'::jsonb,
  edited_blocks_json jsonb not null default '{}'::jsonb,
  locale text not null default 'ru' check (locale in ('ru', 'en')),
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists structured_reports_user_status_idx
  on public.structured_reports (user_id, status, updated_at desc);

create index if not exists structured_reports_study_idx
  on public.structured_reports (study_id)
  where study_id is not null;

-- ---------------------------------------------------------------------------
-- report_citation_links (denormalized for search / audit)
-- ---------------------------------------------------------------------------
create table if not exists public.report_citation_links (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.structured_reports (id) on delete cascade,
  corpus_id text not null,
  label text not null,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists report_citation_links_report_idx
  on public.report_citation_links (report_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.report_templates enable row level security;
alter table public.structured_reports enable row level security;
alter table public.report_citation_links enable row level security;

-- report_templates: read active; admin/author manage catalog
drop policy if exists report_templates_select_active on public.report_templates;
create policy report_templates_select_active on public.report_templates
  for select to authenticated
  using (is_active = true);

drop policy if exists report_templates_insert_admin on public.report_templates;
create policy report_templates_insert_admin on public.report_templates
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'author')
    )
  );

drop policy if exists report_templates_update_admin on public.report_templates;
create policy report_templates_update_admin on public.report_templates
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'author')
    )
  );

drop policy if exists report_templates_delete_admin on public.report_templates;
create policy report_templates_delete_admin on public.report_templates
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- structured_reports: owner-only CRUD
drop policy if exists structured_reports_select_owner on public.structured_reports;
create policy structured_reports_select_owner on public.structured_reports
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists structured_reports_insert_owner on public.structured_reports;
create policy structured_reports_insert_owner on public.structured_reports
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists structured_reports_update_owner on public.structured_reports;
create policy structured_reports_update_owner on public.structured_reports
  for update to authenticated
  using (user_id = auth.uid() and status in ('draft', 'edited'))
  with check (user_id = auth.uid());

drop policy if exists structured_reports_delete_owner on public.structured_reports;
create policy structured_reports_delete_owner on public.structured_reports
  for delete to authenticated
  using (user_id = auth.uid() and status in ('draft', 'edited', 'archived'));

-- report_citation_links: via report owner
drop policy if exists report_citation_links_select_owner on public.report_citation_links;
create policy report_citation_links_select_owner on public.report_citation_links
  for select to authenticated
  using (
    exists (
      select 1 from public.structured_reports r
      where r.id = report_citation_links.report_id and r.user_id = auth.uid()
    )
  );

drop policy if exists report_citation_links_insert_owner on public.report_citation_links;
create policy report_citation_links_insert_owner on public.report_citation_links
  for insert to authenticated
  with check (
    exists (
      select 1 from public.structured_reports r
      where r.id = report_citation_links.report_id and r.user_id = auth.uid()
    )
  );

drop policy if exists report_citation_links_delete_owner on public.report_citation_links;
create policy report_citation_links_delete_owner on public.report_citation_links
  for delete to authenticated
  using (
    exists (
      select 1 from public.structured_reports r
      where r.id = report_citation_links.report_id and r.user_id = auth.uid()
    )
  );

-- ========== 20260624120000_cases_orads_tags.sql ==========
-- Case Library Platform — O-RADS category + tags for search (T1.11)

alter table public.cases
  add column if not exists orads_category smallint,
  add column if not exists tags text[] not null default '{}';

alter table public.cases drop constraint if exists cases_orads_category_check;
alter table public.cases add constraint cases_orads_category_check
  check (orads_category is null or (orads_category >= 0 and orads_category <= 5));

create index if not exists cases_orads_category_idx
  on public.cases (orads_category)
  where orads_category is not null;

create index if not exists cases_tags_gin_idx
  on public.cases using gin (tags);

-- Moderator helper (review queue visibility)
create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('moderator', 'admin')
  );
$$;

-- Extend SELECT: moderators see cases awaiting review
drop policy if exists cases_select_policy on public.cases;
create policy cases_select_policy on public.cases for select using (
  public.is_admin()
  or user_id = auth.uid()
  or (status = 'published' and is_public = true)
  or (status = 'review' and public.is_moderator())
);

-- Moderators may update cases in review queue (expert stub)
drop policy if exists cases_moderator_review_update on public.cases;
create policy cases_moderator_review_update on public.cases for update using (
  public.is_moderator() and status = 'review'
);

comment on column public.cases.orads_category is 'O-RADS US final category (0–5), nullable for non-adnex cases.';
comment on column public.cases.tags is 'Free-form pathology / anatomy tags for gallery search.';

-- ========== 20260624120000_doctor_discussions_extend.sql ==========
-- Doctor discussions: extend cases / teaching_case_comments / doctor_chat_channels.
-- channel_id IS NULL → teaching library case; channel_id IS NOT NULL → colleague question.

alter table public.cases
  add column if not exists channel_id uuid references public.doctor_chat_channels (id) on delete set null;

create index if not exists idx_cases_channel_id on public.cases (channel_id);

alter table public.teaching_case_comments
  add column if not exists is_best_answer boolean not null default false;

-- Push subscription tables
create table if not exists public.channel_subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  channel_id uuid not null references public.doctor_chat_channels (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, channel_id)
);

create table if not exists public.case_subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, case_id)
);

alter table public.channel_subscriptions enable row level security;
alter table public.case_subscriptions enable row level security;

drop policy if exists channel_subscriptions_own on public.channel_subscriptions;
create policy channel_subscriptions_own on public.channel_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists case_subscriptions_own on public.case_subscriptions;
create policy case_subscriptions_own on public.case_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Expo push tokens (mobile registers via authenticated client)
create table if not exists public.user_push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (user_id, expo_push_token)
);

alter table public.user_push_tokens enable row level security;

drop policy if exists user_push_tokens_own on public.user_push_tokens;
create policy user_push_tokens_own on public.user_push_tokens
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-subscribe comment authors (and case author on new question)
create or replace function public.bump_case_subscriptions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.case_subscriptions (user_id, case_id)
  values (new.author_id, new.case_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists trg_bump_case_subscriptions on public.teaching_case_comments;
create trigger trg_bump_case_subscriptions
after insert on public.teaching_case_comments
for each row execute function public.bump_case_subscriptions();

create or replace function public.bump_case_subscriptions_on_case()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.channel_id is not null then
    insert into public.case_subscriptions (user_id, case_id)
    values (new.user_id, new.id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bump_case_subscriptions_on_case on public.cases;
create trigger trg_bump_case_subscriptions_on_case
after insert on public.cases
for each row execute function public.bump_case_subscriptions_on_case();

-- Mark best answer: case author only (RPC)
create or replace function public.mark_best_comment(p_case_id uuid, p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.cases where id = p_case_id and user_id = auth.uid()
  ) then
    raise exception 'only case author can mark best answer';
  end if;

  if not exists (
    select 1 from public.teaching_case_comments
    where id = p_comment_id and case_id = p_case_id
  ) then
    raise exception 'comment not found for case';
  end if;

  update public.teaching_case_comments
  set is_best_answer = (id = p_comment_id)
  where case_id = p_case_id;
end;
$$;

revoke all on function public.mark_best_comment(uuid, uuid) from public;
grant execute on function public.mark_best_comment(uuid, uuid) to authenticated;

-- Specialty sections (slug unique for ON CONFLICT)
create unique index if not exists doctor_chat_channels_slug_key on public.doctor_chat_channels (slug);

insert into public.doctor_chat_channels (id, slug, title, description, sort_order)
values
  (gen_random_uuid(), 'iota-orads', 'IOTA / O-RADS', 'Яичник, IOTA 2026, O-RADS US', 10),
  (gen_random_uuid(), 'fast-efast', 'FAST / EFAST', 'ЭFAST, свободная жидкость, травма', 20),
  (gen_random_uuid(), 'cervix-pathology', 'Патология шейки', 'Кольпоскопия, CIN, шейка матки', 30),
  (gen_random_uuid(), 'breast-us', 'Молочная железа', 'BI-RADS US, МЖ, допплер', 40),
  (gen_random_uuid(), 'vascular-us', 'Сосуды', 'Допплер, вены, артерии', 50)
on conflict (slug) do nothing;

comment on column public.cases.channel_id is 'NULL = teaching library; NOT NULL = colleague question in doctor_chat_channels section.';
comment on column public.teaching_case_comments.is_best_answer is 'Best answer marker; only case author may set via mark_best_comment RPC.';

-- ========== 20260624161753_doctor_discussions_push_webhooks.sql ==========
-- Doctor discussions: pg_net database webhooks → Edge Functions (push).
--
-- One-time setup in Vault (SQL Editor, service role) BEFORE webhooks fire:
--   select vault.create_secret('<PROJECT_REF>', 'supabase_project_ref', 'Supabase project ref for edge URLs');
--   select vault.create_secret('<openssl rand -hex 32>', 'discussions_webhook_secret', 'Webhook header for push edge functions');
-- Optional mirror for Edge Functions CLI:
--   supabase secrets set DISCUSSIONS_WEBHOOK_SECRET=<same hex> --project-ref <PROJECT_REF>

create extension if not exists pg_net with schema extensions;

create or replace function public.get_discussion_vault_secret(p_name text)
returns text
language sql
stable
security definer
set search_path = public, vault, extensions
as $$
  select decrypted_secret::text
  from vault.decrypted_secrets
  where name = p_name
  limit 1;
$$;

revoke all on function public.get_discussion_vault_secret(text) from public;
grant execute on function public.get_discussion_vault_secret(text) to service_role;

create or replace function public.discussion_push_webhook_headers()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, vault, extensions
as $$
declare
  v_secret text;
begin
  v_secret := public.get_discussion_vault_secret('discussions_webhook_secret');
  if coalesce(v_secret, '') = '' then
    raise exception 'Missing Vault secret discussions_webhook_secret';
  end if;

  return jsonb_build_object(
    'Content-Type', 'application/json',
    'x-webhook-secret', v_secret
  );
end;
$$;

create or replace function public.discussion_push_function_url(p_fn text)
returns text
language plpgsql
stable
security definer
set search_path = public, vault, extensions
as $$
declare
  v_ref text;
begin
  v_ref := public.get_discussion_vault_secret('supabase_project_ref');
  if coalesce(v_ref, '') = '' then
    raise exception 'Missing Vault secret supabase_project_ref';
  end if;

  return format('https://%s.supabase.co/functions/v1/%s', v_ref, p_fn);
end;
$$;

create or replace function public.notify_new_comment_webhook_fn()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_id bigint;
  payload jsonb;
begin
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', null
  );

  select net.http_post(
    url := public.discussion_push_function_url('notify-new-comment'),
    headers := public.discussion_push_webhook_headers(),
    body := payload
  ) into request_id;

  return NEW;
end;
$$;

create or replace function public.notify_new_case_question_webhook_fn()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  request_id bigint;
  payload jsonb;
begin
  if NEW.channel_id is null then
    return NEW;
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', null
  );

  select net.http_post(
    url := public.discussion_push_function_url('notify-new-case-question'),
    headers := public.discussion_push_webhook_headers(),
    body := payload
  ) into request_id;

  return NEW;
end;
$$;

drop trigger if exists notify_new_comment_webhook on public.teaching_case_comments;
create trigger notify_new_comment_webhook
after insert on public.teaching_case_comments
for each row execute function public.notify_new_comment_webhook_fn();

drop trigger if exists notify_new_case_question_webhook on public.cases;
create trigger notify_new_case_question_webhook
after insert on public.cases
for each row execute function public.notify_new_case_question_webhook_fn();

-- ========== 20260624162105_doctor_discussions_webhook_secret_verify.sql ==========
-- Doctor discussions: RPC for Edge Functions to verify webhook secret (Vault-backed).

create or replace function public.verify_discussion_webhook_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = public, vault, extensions
as $$
  select coalesce(p_secret, '') <> ''
    and p_secret = public.get_discussion_vault_secret('discussions_webhook_secret');
$$;

revoke all on function public.verify_discussion_webhook_secret(text) from public;
grant execute on function public.verify_discussion_webhook_secret(text) to service_role;

-- ========== 20260624164104_doctor_discussions_vault_seed.sql ==========
-- One-time legacy path: copy hardcoded webhook secret into Vault (prod already migrated).
-- Fresh installs: create secrets manually BEFORE 20260624161753 (see functions/README.md).

do $$
declare
  v_secret text;
begin
  if exists (select 1 from vault.secrets where name = 'discussions_webhook_secret') then
    return;
  end if;

  begin
    v_secret := (select public.discussion_push_webhook_headers() ->> 'x-webhook-secret');
  exception
    when others then
      v_secret := null;
  end;

  if coalesce(v_secret, '') <> '' then
    perform vault.create_secret(
      v_secret,
      'discussions_webhook_secret',
      'Doctor discussions webhook header secret'
    );
  end if;
end $$;

-- ========== 20260625120000_ai_orads_events.sql ==========
-- O-RADS assist analytics: text → extracted features → AI category vs manual (Sprint 2)

create table if not exists public.ai_orads_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  study_id uuid references public.studies (id) on delete set null,
  platform text not null check (platform in ('web', 'mobile')),
  source_text text not null,
  extracted jsonb not null default '{}'::jsonb,
  hints jsonb not null default '[]'::jsonb,
  unresolved_nodes jsonb not null default '[]'::jsonb,
  ai_category_number smallint check (ai_category_number between 0 and 5),
  ai_complete_path jsonb,
  age_years smallint check (age_years between 0 and 130),
  age_source text check (age_source in ('text', 'profile')),
  menopause text check (menopause in ('pre', 'post')),
  menopause_source text check (menopause_source in ('text', 'ui', 'profile')),
  protocol_draft text,
  protocol_draft_source text check (protocol_draft_source in ('local', 'protocol-ai', 'none')),
  manual_category_number smallint check (manual_category_number between 1 and 5),
  feedback_correct boolean,
  feedback_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  feedback_at timestamptz
);

create index if not exists ai_orads_events_user_created_idx
  on public.ai_orads_events (user_id, created_at desc);

create index if not exists ai_orads_events_patient_idx
  on public.ai_orads_events (patient_id, created_at desc)
  where patient_id is not null;

alter table public.ai_orads_events enable row level security;

create policy "ai_orads_events_select_own" on public.ai_orads_events
  for select to authenticated using (auth.uid() = user_id);

create policy "ai_orads_events_insert_own" on public.ai_orads_events
  for insert to authenticated with check (auth.uid() = user_id);

create policy "ai_orads_events_update_own" on public.ai_orads_events
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ========== 20260626120000_cpi_schema.sql ==========
-- Cervical Pathology Intelligence (CPI) — Sonogyn Pro
-- IFCPC · HPV · Bethesda · Histology · CDS · Reports

create table if not exists public.cpi_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'evaluated', 'archived')),
  input jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cpi_cases_user_idx on public.cpi_cases (user_id, updated_at desc);
create index if not exists cpi_cases_patient_idx on public.cpi_cases (patient_id);

create table if not exists public.cpi_colposcopy (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cpi_cases (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cpi_hpv (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cpi_cases (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cpi_cytology (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cpi_cases (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cpi_histology (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cpi_cases (id) on delete cascade,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cpi_risk_results (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cpi_cases (id) on delete cascade,
  cin1_risk numeric(6,5) not null,
  cin2_plus_risk numeric(6,5) not null,
  cin3_plus_risk numeric(6,5) not null,
  ais_risk numeric(6,5) not null,
  invasion_risk numeric(6,5) not null,
  confidence_score numeric(6,5) not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cpi_risk_case_idx on public.cpi_risk_results (case_id, created_at desc);

create table if not exists public.cpi_decisions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cpi_cases (id) on delete cascade,
  actions jsonb not null default '[]'::jsonb,
  explanation text not null,
  evidence jsonb not null default '[]'::jsonb,
  guideline_references jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cpi_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cpi_cases (id) on delete cascade,
  format text not null check (format in ('html', 'pdf', 'docx')),
  content text,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.cpi_images (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cpi_cases (id) on delete cascade,
  kind text not null check (kind in ('pre_acetic', 'post_acetic', 'post_schiller', 'ai_heatmap')),
  storage_path text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.cpi_audit_log (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cpi_cases (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cpi_audit_case_idx on public.cpi_audit_log (case_id, created_at desc);

-- RLS
alter table public.cpi_cases enable row level security;
alter table public.cpi_colposcopy enable row level security;
alter table public.cpi_hpv enable row level security;
alter table public.cpi_cytology enable row level security;
alter table public.cpi_histology enable row level security;
alter table public.cpi_risk_results enable row level security;
alter table public.cpi_decisions enable row level security;
alter table public.cpi_reports enable row level security;
alter table public.cpi_images enable row level security;
alter table public.cpi_audit_log enable row level security;

create policy cpi_cases_own on public.cpi_cases for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy cpi_colposcopy_own on public.cpi_colposcopy for all to authenticated
  using (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()));

create policy cpi_hpv_own on public.cpi_hpv for all to authenticated
  using (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()));

create policy cpi_cytology_own on public.cpi_cytology for all to authenticated
  using (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()));

create policy cpi_histology_own on public.cpi_histology for all to authenticated
  using (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()));

create policy cpi_risk_own on public.cpi_risk_results for all to authenticated
  using (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()));

create policy cpi_decisions_own on public.cpi_decisions for all to authenticated
  using (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()));

create policy cpi_reports_own on public.cpi_reports for all to authenticated
  using (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()));

create policy cpi_images_own on public.cpi_images for all to authenticated
  using (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.cpi_cases c where c.id = case_id and c.user_id = auth.uid()));

create policy cpi_audit_own on public.cpi_audit_log for select to authenticated
  using (user_id = auth.uid());

create policy cpi_audit_insert on public.cpi_audit_log for insert to authenticated
  with check (user_id = auth.uid());

-- ========== 20260627120000_achievements_gamification.sql ==========
-- Геймификация «Звёзды и награды» (Prisma @@map tables)
-- user_id = auth.users.id (Supabase UUID)

CREATE TABLE IF NOT EXISTS prisma_achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_emoji TEXT NOT NULL,
  xp_reward INTEGER NOT NULL,
  criteria_type TEXT NOT NULL,
  criteria_value INTEGER NOT NULL,
  module_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prisma_user_achievements (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES prisma_achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_prisma_user_achievements_user ON prisma_user_achievements(user_id);

CREATE TABLE IF NOT EXISTS prisma_user_progress (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  iota_correct_streak INTEGER NOT NULL DEFAULT 0,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prisma_quiz_results (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  score DOUBLE PRECISION NOT NULL,
  passed BOOLEAN NOT NULL DEFAULT false,
  passed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_prisma_quiz_results_user_module ON prisma_quiz_results(user_id, module_id);
CREATE INDEX IF NOT EXISTS idx_prisma_quiz_results_user_passed ON prisma_quiz_results(user_id, passed_at);

ALTER TABLE prisma_user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prisma_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prisma_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY achievements_select_own ON prisma_user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY progress_select_own ON prisma_user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY quiz_select_own ON prisma_quiz_results
  FOR SELECT USING (auth.uid() = user_id);

-- Справочник бейджей (идемпотентно)
INSERT INTO prisma_achievements (id, name, slug, description, icon_emoji, xp_reward, criteria_type, criteria_value, module_id)
VALUES
  ('ach_orads_explorer', 'O-RADS Explorer', 'orads-explorer', 'Пройдено 3 учебных кейса по O-RADS US', '⭐', 50, 'CASES_COMPLETED', 3, 'orads'),
  ('ach_iota_pro', 'IOTA Pro', 'iota-pro', '5 правильных интерпретаций IOTA подряд', '⭐⭐', 75, 'CORRECT_STREAK', 5, 'iota'),
  ('ach_ultrasound_student', 'Ученик УЗИ', 'ultrasound-student', 'Изучено 10 учебных материалов', '⭐', 50, 'LESSONS_COMPLETED', 10, 'general'),
  ('ach_patient_streak', 'Терпеливый', 'patient-streak', '7 дней подряд заходите в платформу', '🔥', 100, 'LOGIN_STREAK', 7, NULL),
  ('ach_fmf_master', 'FMF Мастер', 'fmf-master', '100% прохождение раздела FMF', '🏆', 150, 'MODULE_COMPLETION', 100, 'fmf')
ON CONFLICT (slug) DO NOTHING;

-- ========== 20260627140000_ai_chat_events.sql ==========
-- Sonogyn AI chat — аудит метаданных (без PHI / base64)

create table if not exists public.ai_chat_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  domain text not null default 'general',
  success boolean not null default false,
  duration_ms integer not null default 0,
  model text not null default '',
  error_code text,
  prompt_tokens integer,
  completion_tokens integer,
  has_images boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_events_user_created_idx
  on public.ai_chat_events (user_id, created_at desc);

alter table public.ai_chat_events enable row level security;

create policy "ai_chat_events_select_own" on public.ai_chat_events
  for select to authenticated using (auth.uid() = user_id);

-- insert только через service role (API route)

-- ========== 20260701120000_case_lifecycle_ia_v2.sql ==========
-- Sonogyn Pro IA v2: CASE lifecycle + anonymization + FTS + editorial flags.
-- Additive: preserves legacy status (draft|review|published|flagged) and channel_id semantics.

-- 1) Lifecycle (parallel to legacy status)
alter table public.cases
  add column if not exists lifecycle_status text
    check (lifecycle_status in ('open', 'discussion', 'resolved', 'confirmed', 'archived')),
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references auth.users (id) on delete set null,
  add column if not exists expert_reviewer_id uuid references auth.users (id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists birads_category text,
  add column if not exists tirads_category text,
  add column if not exists iota_verdict text,
  add column if not exists pathology_tags text[] not null default '{}',
  add column if not exists is_rare boolean not null default false,
  add column if not exists rare_slot text check (rare_slot in ('week', 'month', 'dont_miss')),
  add column if not exists editorial_priority smallint not null default 0,
  add column if not exists search_vector tsvector;

create index if not exists idx_cases_lifecycle_status on public.cases (lifecycle_status);
create index if not exists idx_cases_confirmed_at on public.cases (confirmed_at desc nulls last);
create index if not exists idx_cases_pathology_tags on public.cases using gin (pathology_tags);
create index if not exists idx_cases_search_vector on public.cases using gin (search_vector);

-- Backfill lifecycle from legacy status (idempotent)
update public.cases
set lifecycle_status = case
  when status = 'flagged' then 'archived'
  else 'open'
end
where lifecycle_status is null;

alter table public.cases
  alter column lifecycle_status set default 'open';

-- FTS trigger (title + description + tags)
create or replace function public.cases_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('russian', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('russian', coalesce(new.description, '')), 'B')
    || setweight(
      to_tsvector('simple', coalesce(array_to_string(new.pathology_tags, ' '), '')),
      'C'
    );
  return new;
end;
$$;

drop trigger if exists trg_cases_search_vector on public.cases;
create trigger trg_cases_search_vector
before insert or update of title, description, pathology_tags on public.cases
for each row
execute function public.cases_search_vector_update();

-- 2) Media anonymization (gate R6)
alter table public.case_media
  add column if not exists anonymization_status text not null default 'pending'
    check (anonymization_status in ('pending', 'passed', 'failed', 'waived')),
  add column if not exists anonymization_checked_at timestamptz,
  add column if not exists anonymization_checked_by uuid references auth.users (id) on delete set null,
  add column if not exists blur_regions jsonb not null default '[]'::jsonb;

create index if not exists idx_case_media_anon on public.case_media (anonymization_status);

-- 3) Auto DISCUSSION when first comment
create or replace function public.bump_case_lifecycle_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cases
  set
    lifecycle_status = 'discussion',
    updated_at = now()
  where id = new.case_id
    and lifecycle_status = 'open';

  return new;
end;
$$;

drop trigger if exists trg_bump_lifecycle_on_comment on public.teaching_case_comments;
create trigger trg_bump_lifecycle_on_comment
after insert on public.teaching_case_comments
for each row
execute function public.bump_case_lifecycle_on_comment();

-- 4) RPC: confirm case (expert/moderator only)
create or replace function public.confirm_teaching_case(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();

  if v_role not in ('moderator', 'admin') then
    raise exception 'forbidden';
  end if;

  update public.cases
  set
    lifecycle_status = 'confirmed',
    confirmed_at = now(),
    confirmed_by = auth.uid(),
    expert_reviewer_id = auth.uid(),
    updated_at = now()
  where id = p_case_id;
end;
$$;

revoke all on function public.confirm_teaching_case(uuid) from public;
grant execute on function public.confirm_teaching_case(uuid) to authenticated;

comment on column public.cases.lifecycle_status is
  'IA v2: open→discussion→resolved→confirmed→archived; parallel to legacy status';
comment on column public.cases.channel_id is
  'NULL=library case; NOT NULL=colleague discussion (existing semantics preserved)';
comment on column public.case_media.anonymization_status is
  'Gate R6: public thumb only when passed (or legacy waived after audit)';

-- ========== 20260702120000_case_publish_anon_gate.sql ==========
-- R6 server-side gate: block publish when case_media not anonymized.

create or replace function public.enforce_case_publish_media_anon()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published'
     and new.is_public = true
     and (
       old.status is distinct from 'published'
       or old.is_public is distinct from true
     )
     and exists (
       select 1
       from public.case_media cm
       where cm.case_id = new.id
         and cm.anonymization_status not in ('passed', 'waived')
     )
  then
    raise exception 'publish blocked: confirm media anonymization (R6)';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_case_publish_media_anon on public.cases;
create trigger trg_enforce_case_publish_media_anon
before update on public.cases
for each row
execute function public.enforce_case_publish_media_anon();

comment on function public.enforce_case_publish_media_anon() is
  'Gate R6: cannot set published+public while pending/failed media anonymization';

-- ========== 20260703120000_case_media_legacy_r5_audit.sql ==========
-- R5 Legacy media audit + controlled waive (post manual PHI review).
-- Gate R6 still applies to new uploads; waived = legacy pre-IA-v2 only.

create or replace function public.waive_legacy_case_media(
  p_cutoff timestamptz default timestamptz '2026-07-01 00:00:00+00',
  p_dry_run boolean default true
)
returns table (
  media_id uuid,
  case_id uuid,
  storage_path text,
  uploaded_at timestamptz,
  case_status text,
  action text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_updated int;
begin
  select role into v_role from public.profiles where id = auth.uid();

  if v_role not in ('moderator', 'admin') then
    raise exception 'forbidden';
  end if;

  return query
  select
    cm.id,
    cm.case_id,
    cm.storage_path,
    cm.uploaded_at,
    c.status::text,
    case when p_dry_run then 'dry_run'::text else 'waived'::text end
  from public.case_media cm
  inner join public.cases c on c.id = cm.case_id
  where cm.anonymization_status = 'pending'
    and cm.uploaded_at is not null
    and cm.uploaded_at < p_cutoff
    and c.status = 'published'
    and c.is_public = true
  order by cm.uploaded_at;

  if not p_dry_run then
    update public.case_media cm
    set
      anonymization_status = 'waived',
      anonymization_checked_at = now(),
      anonymization_checked_by = auth.uid()
    from public.cases c
    where cm.case_id = c.id
      and cm.anonymization_status = 'pending'
      and cm.uploaded_at is not null
      and cm.uploaded_at < p_cutoff
      and c.status = 'published'
      and c.is_public = true;

    get diagnostics v_updated = row_count;
    raise notice 'R5 waived % legacy media row(s)', v_updated;
  end if;
end;
$$;

revoke all on function public.waive_legacy_case_media (timestamptz, boolean) from public;
grant execute on function public.waive_legacy_case_media (timestamptz, boolean) to authenticated;

comment on function public.waive_legacy_case_media (timestamptz, boolean) is
  'R5: after manual PHI audit, waive pre-IA-v2 published case media. Default dry_run=true.';

-- ========== 20260704120000_webinar_livekit.sql ==========
-- Webinars: LiveKit sessions + in-room chat (paid enrollment required)

alter table public.course_lessons
  drop constraint if exists course_lessons_lesson_type_check;

alter table public.course_lessons
  add constraint course_lessons_lesson_type_check
  check (lesson_type in ('video', 'offline', 'webinar'));

create table if not exists public.webinar_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.course_lessons (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  room_name text not null unique,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'ended', 'cancelled')),
  scheduled_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  livekit_room_sid text,
  recording_storage_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webinar_sessions_course on public.webinar_sessions (course_id);
create index if not exists idx_webinar_sessions_status_scheduled
  on public.webinar_sessions (status, scheduled_at desc);

create table if not exists public.webinar_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.webinar_sessions (id) on delete cascade,
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_display_name text,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  is_pinned boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_webinar_chat_session_created
  on public.webinar_chat_messages (session_id, created_at asc);

create or replace function public.can_access_webinar(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_lessons cl
    join public.courses c on c.id = cl.course_id
    where cl.id = p_lesson_id
      and cl.lesson_type = 'webinar'
      and (
        public.can_manage_course(cl.course_id)
        or (
          c.status = 'published'
          and c.price_rub > 0
          and exists (
            select 1
            from public.course_enrollments e
            where e.course_id = cl.course_id
              and e.user_id = auth.uid()
          )
        )
      )
  );
$$;

create or replace function public.can_host_webinar(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_lessons cl
    where cl.id = p_lesson_id
      and cl.lesson_type = 'webinar'
      and public.can_manage_course(cl.course_id)
  );
$$;

alter table public.webinar_sessions enable row level security;
alter table public.webinar_chat_messages enable row level security;

drop policy if exists webinar_sessions_select on public.webinar_sessions;
create policy webinar_sessions_select on public.webinar_sessions
  for select to authenticated
  using (
    public.can_access_webinar(lesson_id)
    or exists (
      select 1
      from public.course_lessons cl
      join public.courses c on c.id = cl.course_id
      where cl.id = lesson_id
        and c.status = 'published'
    )
  );

drop policy if exists webinar_sessions_manage on public.webinar_sessions;
create policy webinar_sessions_manage on public.webinar_sessions
  for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists webinar_chat_select on public.webinar_chat_messages;
create policy webinar_chat_select on public.webinar_chat_messages
  for select to authenticated
  using (public.can_access_webinar(lesson_id) and is_hidden = false);

drop policy if exists webinar_chat_insert on public.webinar_chat_messages;
create policy webinar_chat_insert on public.webinar_chat_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_webinar(lesson_id)
  );

drop policy if exists webinar_chat_moderate on public.webinar_chat_messages;
create policy webinar_chat_moderate on public.webinar_chat_messages
  for update to authenticated
  using (public.can_host_webinar(lesson_id))
  with check (public.can_host_webinar(lesson_id));

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'webinar_chat_messages'
  ) then
    alter publication supabase_realtime add table public.webinar_chat_messages;
  end if;
end $migration$;
