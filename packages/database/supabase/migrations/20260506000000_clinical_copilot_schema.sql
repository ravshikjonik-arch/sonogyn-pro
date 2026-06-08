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
