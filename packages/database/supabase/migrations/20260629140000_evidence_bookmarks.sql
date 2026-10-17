-- User bookmarks for Evidence Assistant citations

create table if not exists public.evidence_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  record_id text not null,
  provider text not null,
  title text not null,
  url text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, record_id)
);

create index if not exists evidence_bookmarks_user_created_idx
  on public.evidence_bookmarks (user_id, created_at desc);

alter table public.evidence_bookmarks enable row level security;

create policy "evidence_bookmarks_select_own" on public.evidence_bookmarks
  for select to authenticated using (auth.uid() = user_id);

create policy "evidence_bookmarks_insert_own" on public.evidence_bookmarks
  for insert to authenticated with check (auth.uid() = user_id);

create policy "evidence_bookmarks_update_own" on public.evidence_bookmarks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "evidence_bookmarks_delete_own" on public.evidence_bookmarks
  for delete to authenticated using (auth.uid() = user_id);
