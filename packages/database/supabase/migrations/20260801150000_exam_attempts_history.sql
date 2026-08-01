-- Phase 2 · T2.3 — allow certification/mock/quick history (append-only)
-- Keep single upsertable row for self_assessment via partial unique index.

alter table public.exam_attempts
  drop constraint if exists exam_attempts_user_id_blueprint_id_mode_key;

-- Some environments name the unique constraint differently
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.exam_attempts'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) ilike '%user_id%blueprint_id%mode%';
  if cname is not null then
    execute format('alter table public.exam_attempts drop constraint %I', cname);
  end if;
end $$;

create unique index if not exists exam_attempts_self_assessment_uidx
  on public.exam_attempts (user_id, blueprint_id)
  where mode = 'self_assessment';

create index if not exists exam_attempts_user_mode_started_idx
  on public.exam_attempts (user_id, mode, started_at desc);
