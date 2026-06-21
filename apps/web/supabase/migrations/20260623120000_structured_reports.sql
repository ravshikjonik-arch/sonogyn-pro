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
