-- Protocol structured draft lifecycle: DRAFT → REVIEW → FINALIZED → AMENDED → ARCHIVED
-- Apply on staging before production.

begin;

alter table public.protocol_structured_drafts
  add column if not exists lifecycle_status text not null default 'draft'
    check (lifecycle_status in ('draft', 'review', 'finalized', 'amended', 'archived')),
  add column if not exists version_number int not null default 1 check (version_number > 0),
  add column if not exists previous_version_id uuid,
  add column if not exists finalized_at timestamptz,
  add column if not exists finalized_by uuid references auth.users (id) on delete set null,
  add column if not exists amendment_reason text,
  add column if not exists content_hash text;

create index if not exists protocol_structured_drafts_lifecycle_idx
  on public.protocol_structured_drafts (lifecycle_status, updated_at desc);

alter table public.protocol_structured_draft_versions
  add column if not exists lifecycle_status text,
  add column if not exists content_hash text,
  add column if not exists finalized_at timestamptz,
  add column if not exists finalized_by uuid references auth.users (id) on delete set null,
  add column if not exists amendment_reason text,
  add column if not exists previous_version_id uuid;

alter table public.protocol_structured_draft_audit_events
  drop constraint if exists protocol_structured_draft_audit_events_event_type_check;

alter table public.protocol_structured_draft_audit_events
  add constraint protocol_structured_draft_audit_events_event_type_check
  check (event_type in (
    'save', 'autosave', 'restore', 'version_restore', 'export',
    'submit_review', 'finalize', 'amend', 'archive'
  ));

-- Block silent edits on finalized drafts (except via lifecycle RPC)
create or replace function public.guard_protocol_draft_lifecycle_update()
returns trigger
language plpgsql
as $$
begin
  if old.lifecycle_status = 'finalized' and new.lifecycle_status = 'finalized' then
    if coalesce(current_setting('app.protocol_lifecycle_transition', true), '') <> 'true' then
      if old.sections_json is distinct from new.sections_json
        or old.editor_state_json is distinct from new.editor_state_json
        or old.search_text is distinct from new.search_text then
        raise exception 'finalized protocol cannot be modified directly'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_protocol_draft_lifecycle on public.protocol_structured_drafts;
create trigger trg_guard_protocol_draft_lifecycle
before update on public.protocol_structured_drafts
for each row execute function public.guard_protocol_draft_lifecycle_update();

create or replace function public.transition_protocol_structured_lifecycle(
  p_study_id uuid,
  p_action text,
  p_content_hash text default null,
  p_amendment_reason text default null,
  p_request_id text default null,
  p_idempotency_key text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_draft public.protocol_structured_drafts%rowtype;
  v_from text;
  v_to text;
  v_version_id uuid;
  v_existing uuid;
begin
  if v_actor is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if p_idempotency_key is not null then
    select id into v_existing
    from public.protocol_structured_draft_audit_events
    where study_id = p_study_id
      and meta->>'idempotency_key' = p_idempotency_key
    limit 1;
    if v_existing is not null then
      raise exception 'idempotent replay' using errcode = '23505';
    end if;
  end if;

  select * into v_draft
  from public.protocol_structured_drafts
  where study_id = p_study_id and user_id = v_actor
  for update;

  if not found then
    raise exception 'draft not found' using errcode = 'P0002';
  end if;

  v_from := v_draft.lifecycle_status;
  perform set_config('app.protocol_lifecycle_transition', 'true', true);

  if p_action = 'submit_review' then
    if v_from not in ('draft', 'amended') then
      raise exception 'invalid transition' using errcode = '22023';
    end if;
    v_to := 'review';
    update public.protocol_structured_drafts
    set lifecycle_status = v_to, updated_at = now()
    where id = v_draft.id;

  elsif p_action = 'finalize' then
    if v_from not in ('draft', 'review', 'amended') then
      raise exception 'invalid transition' using errcode = '22023';
    end if;
    if coalesce(length(trim(p_content_hash)), 0) < 16 then
      raise exception 'content_hash required' using errcode = '22023';
    end if;
    if v_draft.physician_confirmed_conclusion is not true then
      raise exception 'physician confirmation required' using errcode = '22023';
    end if;
    v_to := 'finalized';

    insert into public.protocol_structured_draft_versions (
      draft_id, study_id, user_id, version_number,
      sections_json, editor_state_json, search_text,
      template_version, algorithm_version, algorithm_date, scale_source,
      change_summary, lifecycle_status, content_hash, finalized_at, finalized_by
    ) values (
      v_draft.id, p_study_id, v_actor, v_draft.version_number,
      v_draft.sections_json, v_draft.editor_state_json, v_draft.search_text,
      v_draft.template_version, v_draft.algorithm_version, v_draft.algorithm_date, v_draft.scale_source,
      'Финализация', v_to, p_content_hash, now(), v_actor
    )
    returning id into v_version_id;

    update public.protocol_structured_drafts
    set
      lifecycle_status = v_to,
      finalized_at = now(),
      finalized_by = v_actor,
      content_hash = p_content_hash,
      previous_version_id = v_version_id,
      updated_at = now()
    where id = v_draft.id;

  elsif p_action = 'amend' then
    if v_from <> 'finalized' then
      raise exception 'invalid transition' using errcode = '22023';
    end if;
    if coalesce(length(trim(p_amendment_reason)), 0) < 3 then
      raise exception 'amendment_reason required' using errcode = '22023';
    end if;
    v_to := 'draft';

    insert into public.protocol_structured_draft_versions (
      draft_id, study_id, user_id, version_number,
      sections_json, editor_state_json, search_text,
      template_version, algorithm_version, algorithm_date, scale_source,
      change_summary, lifecycle_status, content_hash, finalized_at, finalized_by,
      amendment_reason, previous_version_id
    ) values (
      v_draft.id, p_study_id, v_actor, v_draft.version_number,
      v_draft.sections_json, v_draft.editor_state_json, v_draft.search_text,
      v_draft.template_version, v_draft.algorithm_version, v_draft.algorithm_date, v_draft.scale_source,
      p_amendment_reason, 'finalized', v_draft.content_hash, v_draft.finalized_at, v_draft.finalized_by,
      p_amendment_reason, v_draft.previous_version_id
    );

    update public.protocol_structured_drafts
    set
      lifecycle_status = v_to,
      version_number = v_draft.version_number + 1,
      finalized_at = null,
      finalized_by = null,
      amendment_reason = p_amendment_reason,
      physician_confirmed_conclusion = false,
      updated_at = now()
    where id = v_draft.id;

  elsif p_action = 'archive' then
    v_to := 'archived';
    update public.protocol_structured_drafts
    set lifecycle_status = v_to, updated_at = now()
    where id = v_draft.id;

  else
    raise exception 'unknown action' using errcode = '22023';
  end if;

  insert into public.protocol_structured_draft_audit_events (
    study_id, user_id, event_type, version_number, meta
  ) values (
    p_study_id, v_actor, p_action, v_draft.version_number,
    jsonb_build_object(
      'from_status', v_from,
      'to_status', v_to,
      'request_id', p_request_id,
      'idempotency_key', p_idempotency_key
    )
  );

  perform public.write_clinical_platform_audit(
    v_actor,
    'protocol.lifecycle.' || p_action,
    'protocol_draft',
    v_draft.id,
    p_request_id,
    jsonb_build_object('study_id', p_study_id, 'from_status', v_from, 'to_status', v_to)
  );
end;
$$;

revoke all on function public.transition_protocol_structured_lifecycle(uuid, text, text, text, text, text) from public;
grant execute on function public.transition_protocol_structured_lifecycle(uuid, text, text, text, text, text) to authenticated;

commit;
