-- Regulation ingest pipeline (RF sources → review → clinical-guidelines merge)

create type public.regulation_ingest_status as enum (
  'discovered',
  'pending_extraction',
  'extracted',
  'in_review',
  'approved',
  'rejected',
  'published'
);

create table if not exists public.regulation_ingest_queue (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  source_url text not null,
  title text not null,
  content_hash text not null,
  raw_snippet text,
  document_kind text,
  status public.regulation_ingest_status not null default 'discovered',
  fetched_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, content_hash),
  unique (source, external_id)
);

create index if not exists regulation_ingest_queue_status_fetched_idx
  on public.regulation_ingest_queue (status, fetched_at desc);

create table if not exists public.regulation_extractions (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.regulation_ingest_queue (id) on delete cascade,
  extracted_json jsonb not null,
  model text,
  confidence text check (confidence in ('low', 'medium', 'high')),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  review_note text,
  created_at timestamptz not null default now()
);

create index if not exists regulation_extractions_queue_created_idx
  on public.regulation_extractions (queue_id, created_at desc);

alter table public.regulation_ingest_queue enable row level security;
alter table public.regulation_extractions enable row level security;

create policy regulation_ingest_queue_select_admin on public.regulation_ingest_queue
  for select to authenticated using (public.is_admin());

create policy regulation_ingest_queue_insert_admin on public.regulation_ingest_queue
  for insert to authenticated with check (public.is_admin());

create policy regulation_ingest_queue_update_admin on public.regulation_ingest_queue
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy regulation_extractions_select_admin on public.regulation_extractions
  for select to authenticated using (public.is_admin());

create policy regulation_extractions_insert_admin on public.regulation_extractions
  for insert to authenticated with check (public.is_admin());

create policy regulation_extractions_update_admin on public.regulation_extractions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

comment on table public.regulation_ingest_queue is 'Discovered RF orders/KR URLs and snippets awaiting AI extraction and medical review.';
comment on table public.regulation_extractions is 'LLM-structured drafts; not published to prod guidelines until admin approved.';
