-- Structured clinical case + ultrasound protocol draft editors.
-- HTML is NOT the sole source of truth: sections_json + search_text + template/algorithm versions.

-- ---------------------------------------------------------------------------
-- Teaching case structured documents
-- ---------------------------------------------------------------------------
create table if not exists public.case_structured_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sections_json jsonb not null default '{}'::jsonb,
  editor_state_json jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  template_version text not null default 'case-v1',
  algorithm_version text,
  physician_confirmed_conclusion boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_structured_documents_case_id_key unique (case_id)
);

create index if not exists case_structured_documents_user_idx
  on public.case_structured_documents (user_id, updated_at desc);

create index if not exists case_structured_documents_search_idx
  on public.case_structured_documents using gin (to_tsvector('simple', search_text));

-- ---------------------------------------------------------------------------
-- Version history (case)
-- ---------------------------------------------------------------------------
create table if not exists public.case_structured_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.case_structured_documents (id) on delete cascade,
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  version_number int not null check (version_number > 0),
  sections_json jsonb not null,
  editor_state_json jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  template_version text not null,
  algorithm_version text,
  change_summary text,
  created_at timestamptz not null default now(),
  constraint case_structured_document_versions_doc_ver_key unique (document_id, version_number)
);

create index if not exists case_structured_document_versions_case_idx
  on public.case_structured_document_versions (case_id, version_number desc);

-- ---------------------------------------------------------------------------
-- Audit events (case) — no PHI in meta
-- ---------------------------------------------------------------------------
create table if not exists public.case_structured_document_audit_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null
    check (event_type in ('save', 'autosave', 'restore', 'version_restore', 'export')),
  version_number int,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists case_structured_document_audit_case_idx
  on public.case_structured_document_audit_events (case_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Ultrasound protocol structured drafts
-- ---------------------------------------------------------------------------
create table if not exists public.protocol_structured_drafts (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  sections_json jsonb not null default '{}'::jsonb,
  editor_state_json jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  template_version text not null default 'protocol-v1',
  algorithm_version text,
  algorithm_date date,
  scale_source text,
  physician_confirmed_conclusion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint protocol_structured_drafts_study_id_key unique (study_id)
);

create index if not exists protocol_structured_drafts_user_idx
  on public.protocol_structured_drafts (user_id, updated_at desc);

create table if not exists public.protocol_structured_draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.protocol_structured_drafts (id) on delete cascade,
  study_id uuid not null references public.studies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  version_number int not null check (version_number > 0),
  sections_json jsonb not null,
  editor_state_json jsonb not null default '{}'::jsonb,
  search_text text not null default '',
  template_version text not null,
  algorithm_version text,
  algorithm_date date,
  scale_source text,
  change_summary text,
  created_at timestamptz not null default now(),
  constraint protocol_structured_draft_versions_draft_ver_key unique (draft_id, version_number)
);

create index if not exists protocol_structured_draft_versions_study_idx
  on public.protocol_structured_draft_versions (study_id, version_number desc);

create table if not exists public.protocol_structured_draft_audit_events (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null
    check (event_type in ('save', 'autosave', 'restore', 'version_restore', 'export')),
  version_number int,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists protocol_structured_draft_audit_study_idx
  on public.protocol_structured_draft_audit_events (study_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
drop trigger if exists case_structured_documents_set_updated_at on public.case_structured_documents;
create trigger case_structured_documents_set_updated_at
  before update on public.case_structured_documents
  for each row execute function public.set_updated_at();

drop trigger if exists protocol_structured_drafts_set_updated_at on public.protocol_structured_drafts;
create trigger protocol_structured_drafts_set_updated_at
  before update on public.protocol_structured_drafts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS — owner only; no public/anonymous access
-- ---------------------------------------------------------------------------
alter table public.case_structured_documents enable row level security;
alter table public.case_structured_document_versions enable row level security;
alter table public.case_structured_document_audit_events enable row level security;
alter table public.protocol_structured_drafts enable row level security;
alter table public.protocol_structured_draft_versions enable row level security;
alter table public.protocol_structured_draft_audit_events enable row level security;

-- case_structured_documents
drop policy if exists case_structured_documents_owner_all on public.case_structured_documents;
create policy case_structured_documents_owner_all on public.case_structured_documents
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists case_structured_document_versions_owner_all on public.case_structured_document_versions;
create policy case_structured_document_versions_owner_all on public.case_structured_document_versions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists case_structured_document_audit_owner_insert on public.case_structured_document_audit_events;
create policy case_structured_document_audit_owner_insert on public.case_structured_document_audit_events
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists case_structured_document_audit_owner_select on public.case_structured_document_audit_events;
create policy case_structured_document_audit_owner_select on public.case_structured_document_audit_events
  for select to authenticated
  using (user_id = auth.uid());

-- protocol_structured_drafts
drop policy if exists protocol_structured_drafts_owner_all on public.protocol_structured_drafts;
create policy protocol_structured_drafts_owner_all on public.protocol_structured_drafts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists protocol_structured_draft_versions_owner_all on public.protocol_structured_draft_versions;
create policy protocol_structured_draft_versions_owner_all on public.protocol_structured_draft_versions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists protocol_structured_draft_audit_owner_insert on public.protocol_structured_draft_audit_events;
create policy protocol_structured_draft_audit_owner_insert on public.protocol_structured_draft_audit_events
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists protocol_structured_draft_audit_owner_select on public.protocol_structured_draft_audit_events;
create policy protocol_structured_draft_audit_owner_select on public.protocol_structured_draft_audit_events
  for select to authenticated
  using (user_id = auth.uid());

comment on table public.case_structured_documents is
  'Structured teaching-case editor state (sections JSON + search text; not HTML-only).';
comment on table public.protocol_structured_drafts is
  'Structured ultrasound protocol draft sections parallel to measurements payload.';
