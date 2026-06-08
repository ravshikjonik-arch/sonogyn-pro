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
