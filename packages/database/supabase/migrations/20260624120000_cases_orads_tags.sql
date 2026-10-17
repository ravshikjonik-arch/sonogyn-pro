-- Case Library Platform — O-RADS category + tags for search (T1.11)

alter table public.cases
  add column if not exists orads_category smallint,
  add column if not exists tags text[] not null default '{}';

alter table public.cases drop constraint if exists cases_orads_category_check;
alter table public.cases add constraint cases_orads_category_check
  check (orads_category is null or (orads_category >= 0 and orads_category <= 5));

create index if not exists cases_orads_category_idx
  on public.cases (orads_category)
  where orads_category is not null;

create index if not exists cases_tags_gin_idx
  on public.cases using gin (tags);

-- Moderator helper (review queue visibility)
create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('moderator', 'admin')
  );
$$;

-- Extend SELECT: moderators see cases awaiting review
drop policy if exists cases_select_policy on public.cases;
create policy cases_select_policy on public.cases for select using (
  public.is_admin()
  or user_id = auth.uid()
  or (status = 'published' and is_public = true)
  or (status = 'review' and public.is_moderator())
);

-- Moderators may update cases in review queue (expert stub)
drop policy if exists cases_moderator_review_update on public.cases;
create policy cases_moderator_review_update on public.cases for update using (
  public.is_moderator() and status = 'review'
);

comment on column public.cases.orads_category is 'O-RADS US final category (0–5), nullable for non-adnex cases.';
comment on column public.cases.tags is 'Free-form pathology / anatomy tags for gallery search.';
