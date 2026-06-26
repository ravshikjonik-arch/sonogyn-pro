-- =============================================================================
-- SonoGyn Pro · IA v2 lifecycle bundle (SQL Editor)
-- =============================================================================
-- Куда: Supabase Dashboard → SQL Editor → вставить целиком → Run
-- Источник: supabase/migrations/20260701120000_case_lifecycle_ia_v2.sql
-- Безопасно повторно: IF NOT EXISTS / CREATE OR REPLACE
-- =============================================================================

-- 1) Lifecycle (parallel to legacy status)
alter table public.cases
  add column if not exists lifecycle_status text
    check (lifecycle_status in ('open', 'discussion', 'resolved', 'confirmed', 'archived')),
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_by uuid references auth.users (id) on delete set null,
  add column if not exists expert_reviewer_id uuid references auth.users (id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists birads_category text,
  add column if not exists tirads_category text,
  add column if not exists iota_verdict text,
  add column if not exists pathology_tags text[] not null default '{}',
  add column if not exists is_rare boolean not null default false,
  add column if not exists rare_slot text check (rare_slot in ('week', 'month', 'dont_miss')),
  add column if not exists editorial_priority smallint not null default 0,
  add column if not exists search_vector tsvector;

-- orads_category уже из 20260624120000_cases_orads_tags.sql — не дублируем

create index if not exists idx_cases_lifecycle_status on public.cases (lifecycle_status);
create index if not exists idx_cases_confirmed_at on public.cases (confirmed_at desc nulls last);
create index if not exists idx_cases_pathology_tags on public.cases using gin (pathology_tags);
create index if not exists idx_cases_search_vector on public.cases using gin (search_vector);

update public.cases
set lifecycle_status = case
  when status = 'flagged' then 'archived'
  else 'open'
end
where lifecycle_status is null;

alter table public.cases
  alter column lifecycle_status set default 'open';

create or replace function public.cases_search_vector_update()
returns trigger
language plpgsql
as $$
begin
  new.search_vector :=
    setweight(to_tsvector('russian', coalesce(new.title, '')), 'A')
    || setweight(to_tsvector('russian', coalesce(new.description, '')), 'B')
    || setweight(
      to_tsvector('simple', coalesce(array_to_string(new.pathology_tags, ' '), '')),
      'C'
    );
  return new;
end;
$$;

drop trigger if exists trg_cases_search_vector on public.cases;
create trigger trg_cases_search_vector
before insert or update of title, description, pathology_tags on public.cases
for each row
execute function public.cases_search_vector_update();

-- 2) Media anonymization (gate R6)
alter table public.case_media
  add column if not exists anonymization_status text not null default 'pending'
    check (anonymization_status in ('pending', 'passed', 'failed', 'waived')),
  add column if not exists anonymization_checked_at timestamptz,
  add column if not exists anonymization_checked_by uuid references auth.users (id) on delete set null,
  add column if not exists blur_regions jsonb not null default '[]'::jsonb;

create index if not exists idx_case_media_anon on public.case_media (anonymization_status);

-- 3) Auto DISCUSSION on first comment
create or replace function public.bump_case_lifecycle_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cases
  set lifecycle_status = 'discussion', updated_at = now()
  where id = new.case_id and lifecycle_status = 'open';
  return new;
end;
$$;

drop trigger if exists trg_bump_lifecycle_on_comment on public.teaching_case_comments;
create trigger trg_bump_lifecycle_on_comment
after insert on public.teaching_case_comments
for each row
execute function public.bump_case_lifecycle_on_comment();

-- 4) RPC: confirm case (moderator/admin)
create or replace function public.confirm_teaching_case(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role not in ('moderator', 'admin') then
    raise exception 'forbidden';
  end if;
  update public.cases
  set
    lifecycle_status = 'confirmed',
    confirmed_at = now(),
    confirmed_by = auth.uid(),
    expert_reviewer_id = auth.uid(),
    updated_at = now()
  where id = p_case_id;
end;
$$;

revoke all on function public.confirm_teaching_case(uuid) from public;
grant execute on function public.confirm_teaching_case(uuid) to authenticated;

comment on column public.cases.lifecycle_status is
  'IA v2: open→discussion→resolved→confirmed→archived; parallel to legacy status';
comment on column public.case_media.anonymization_status is
  'Gate R6: public thumb only when passed (or legacy waived after audit)';
