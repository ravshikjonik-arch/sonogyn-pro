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
