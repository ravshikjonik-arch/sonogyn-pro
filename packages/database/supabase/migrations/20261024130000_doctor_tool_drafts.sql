-- Черновики клинических инструментов на уровне врача (без patient / study).

create table if not exists public.doctor_tool_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool_id text not null,
  state_json jsonb not null default '{}'::jsonb,
  preview_text text not null default '',
  schema_version text not null,
  lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft', 'finalized', 'archived')),
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint doctor_tool_drafts_user_tool_key unique (user_id, tool_id)
);

create index if not exists doctor_tool_drafts_user_updated_idx
  on public.doctor_tool_drafts (user_id, updated_at desc);

alter table public.doctor_tool_drafts enable row level security;

drop policy if exists doctor_tool_drafts_owner_all on public.doctor_tool_drafts;
create policy doctor_tool_drafts_owner_all on public.doctor_tool_drafts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop trigger if exists doctor_tool_drafts_set_updated_at on public.doctor_tool_drafts;
create trigger doctor_tool_drafts_set_updated_at
  before update on public.doctor_tool_drafts
  for each row
  execute function public.set_updated_at();

comment on table public.doctor_tool_drafts is
  'Per-doctor tool drafts (no PHI patient binding). One row per user + tool_id.';
