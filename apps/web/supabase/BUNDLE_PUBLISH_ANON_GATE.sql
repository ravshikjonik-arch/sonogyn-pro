-- R6 server-side publish gate — SQL Editor bundle (idempotent)
-- Source: migrations/20260702120000_case_publish_anon_gate.sql

create or replace function public.enforce_case_publish_media_anon()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published'
     and new.is_public = true
     and (
       old.status is distinct from 'published'
       or old.is_public is distinct from true
     )
     and exists (
       select 1
       from public.case_media cm
       where cm.case_id = new.id
         and cm.anonymization_status not in ('passed', 'waived')
     )
  then
    raise exception 'publish blocked: confirm media anonymization (R6)';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_case_publish_media_anon on public.cases;
create trigger trg_enforce_case_publish_media_anon
before update on public.cases
for each row
execute function public.enforce_case_publish_media_anon();

notify pgrst, 'reload schema';
