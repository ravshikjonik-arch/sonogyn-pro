-- Evidence retrieval audit log (no PHI in query — clinician terms only)

create table if not exists public.evidence_query_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  query text not null,
  sources text[] not null default '{}',
  result_count integer not null default 0,
  synthesis_mode text not null default 'rules',
  evidence_strength text,
  created_at timestamptz not null default now()
);

create index if not exists evidence_query_log_user_created_idx
  on public.evidence_query_log (user_id, created_at desc);

alter table public.evidence_query_log enable row level security;

create policy "evidence_query_log_select_own" on public.evidence_query_log
  for select to authenticated using (auth.uid() = user_id);

-- Ingested external guidelines (WHO/NICE/EMA) for Phase 2 cron
create table if not exists public.guidelines_external_index (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  title text not null,
  url text not null,
  body_text text,
  published_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (source, external_id)
);

create index if not exists guidelines_external_index_source_title_idx
  on public.guidelines_external_index (source, title);

alter table public.guidelines_external_index enable row level security;

create policy "guidelines_external_index_select_authenticated" on public.guidelines_external_index
  for select to authenticated using (true);
