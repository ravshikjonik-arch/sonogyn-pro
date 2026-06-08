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
