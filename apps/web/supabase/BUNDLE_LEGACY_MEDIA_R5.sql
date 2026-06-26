-- R5 Legacy media audit — SQL Editor bundle (idempotent)
-- Source: migrations/20260703120000_case_media_legacy_r5_audit.sql
--
-- Workflow:
--   1) Run audit queries below (read-only)
--   2) Manual PHI review of listed files
--   3) Dry-run RPC: select * from public.waive_legacy_case_media();
--   4) Apply waive: select * from public.waive_legacy_case_media('2026-07-01'::timestamptz, false);

-- ── Audit 1: counts by anonymization_status ──
select
  anonymization_status,
  count(*) as media_count,
  count(distinct case_id) as case_count
from public.case_media
group by 1
order by 1;

-- ── Audit 2: published public cases with blocked media (R6 thumbs + re-publish) ──
select
  c.id as case_id,
  c.title,
  c.status,
  count(cm.id) filter (
    where cm.anonymization_status not in ('passed', 'waived')
  ) as blocked_files,
  count(cm.id) as total_files
from public.cases c
inner join public.case_media cm on cm.case_id = c.id
where c.status = 'published'
  and c.is_public = true
group by c.id, c.title, c.status
having count(cm.id) filter (
  where cm.anonymization_status not in ('passed', 'waived')
) > 0
order by blocked_files desc, c.title;

-- ── Audit 3: legacy candidates (pending + uploaded before IA v2 cutoff) ──
select
  cm.id as media_id,
  cm.case_id,
  cm.storage_path,
  cm.uploaded_at,
  c.status as case_status,
  c.is_public
from public.case_media cm
inner join public.cases c on c.id = cm.case_id
where cm.anonymization_status = 'pending'
  and cm.uploaded_at is not null
  and cm.uploaded_at < timestamptz '2026-07-01 00:00:00+00'
order by cm.uploaded_at;

-- ── RPC: controlled waive (moderator/admin only) ──
create or replace function public.waive_legacy_case_media(
  p_cutoff timestamptz default timestamptz '2026-07-01 00:00:00+00',
  p_dry_run boolean default true
)
returns table (
  media_id uuid,
  case_id uuid,
  storage_path text,
  uploaded_at timestamptz,
  case_status text,
  action text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_updated int;
begin
  select role into v_role from public.profiles where id = auth.uid();

  if v_role not in ('moderator', 'admin') then
    raise exception 'forbidden';
  end if;

  return query
  select
    cm.id,
    cm.case_id,
    cm.storage_path,
    cm.uploaded_at,
    c.status::text,
    case when p_dry_run then 'dry_run'::text else 'waived'::text end
  from public.case_media cm
  inner join public.cases c on c.id = cm.case_id
  where cm.anonymization_status = 'pending'
    and cm.uploaded_at is not null
    and cm.uploaded_at < p_cutoff
    and c.status = 'published'
    and c.is_public = true
  order by cm.uploaded_at;

  if not p_dry_run then
    update public.case_media cm
    set
      anonymization_status = 'waived',
      anonymization_checked_at = now(),
      anonymization_checked_by = auth.uid()
    from public.cases c
    where cm.case_id = c.id
      and cm.anonymization_status = 'pending'
      and cm.uploaded_at is not null
      and cm.uploaded_at < p_cutoff
      and c.status = 'published'
      and c.is_public = true;

    get diagnostics v_updated = row_count;
    raise notice 'R5 waived % legacy media row(s)', v_updated;
  end if;
end;
$$;

revoke all on function public.waive_legacy_case_media (timestamptz, boolean) from public;
grant execute on function public.waive_legacy_case_media (timestamptz, boolean) to authenticated;

comment on function public.waive_legacy_case_media (timestamptz, boolean) is
  'R5: after manual PHI audit, waive pre-IA-v2 published case media. Default dry_run=true.';

notify pgrst, 'reload schema';
