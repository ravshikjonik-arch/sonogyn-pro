-- SonoGyn Pro · hardening INCREMENTAL (v3 already applied)
-- Supabase SQL Editor → Run (project from: npm run db:project)
-- Generated: 2026-09-10T17:36:03.169Z

-- ========== 20260910180000_case_lifecycle_hardening.sql ==========
-- Case lifecycle hardening: audit completeness, request_id, idempotency, direct-update guard.
-- Extends 20260830170000_case_discussions_v3.sql — apply on staging first.

begin;

-- ---------------------------------------------------------------------------
-- Lifecycle audit: request correlation + idempotency
-- ---------------------------------------------------------------------------
alter table public.case_lifecycle_events
  add column if not exists request_id text,
  add column if not exists reason text,
  add column if not exists idempotency_key text;

create unique index if not exists case_lifecycle_events_idempotency_uidx
  on public.case_lifecycle_events (case_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists case_lifecycle_events_request_idx
  on public.case_lifecycle_events (request_id)
  where request_id is not null;

-- ---------------------------------------------------------------------------
-- Unified clinical platform audit (append-only, no document bodies)
-- ---------------------------------------------------------------------------
create table if not exists public.clinical_platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  actor_role text,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists clinical_platform_audit_entity_idx
  on public.clinical_platform_audit_events (entity_type, entity_id, created_at desc);

create index if not exists clinical_platform_audit_request_idx
  on public.clinical_platform_audit_events (request_id)
  where request_id is not null;

alter table public.clinical_platform_audit_events enable row level security;

drop policy if exists clinical_platform_audit_select on public.clinical_platform_audit_events;
create policy clinical_platform_audit_select on public.clinical_platform_audit_events
  for select to authenticated
  using (
    public.is_admin()
    or public.is_moderator()
    or (
      entity_type = 'case'
      and exists (
        select 1 from public.cases c
        where c.id = clinical_platform_audit_events.entity_id
          and c.user_id = auth.uid()
      )
    )
  );

-- No INSERT/UPDATE/DELETE policies for authenticated — writes via security definer only.

-- ---------------------------------------------------------------------------
-- Confirmation methods: extend (backward compatible)
-- ---------------------------------------------------------------------------
alter table public.cases drop constraint if exists cases_confirmation_method_check;
alter table public.cases add constraint cases_confirmation_method_check
  check (confirmation_method is null or confirmation_method in (
    'histology', 'surgery', 'mri', 'ct', 'genetics',
    'dynamic_observation', 'expert_consilium',
    'laboratory', 'clinical_follow_up', 'other'
  ));

-- ---------------------------------------------------------------------------
-- Guard: lifecycle_status only via RPC (session flag)
-- ---------------------------------------------------------------------------
create or replace function public.guard_direct_case_lifecycle_update()
returns trigger
language plpgsql
as $$
begin
  if old.lifecycle_status is distinct from new.lifecycle_status then
    if coalesce(current_setting('app.lifecycle_transition', true), '') <> 'true' then
      raise exception 'lifecycle_status must be changed via transition_case_lifecycle'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_direct_case_lifecycle on public.cases;
create trigger trg_guard_direct_case_lifecycle
before update of lifecycle_status on public.cases
for each row execute function public.guard_direct_case_lifecycle_update();

-- ---------------------------------------------------------------------------
-- Auto DISCUSSION on first comment + audit trail
-- ---------------------------------------------------------------------------
create or replace function public.bump_case_lifecycle_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_updated int;
begin
  perform set_config('app.lifecycle_transition', 'true', true);

  update public.cases
  set lifecycle_status = 'discussion', updated_at = now()
  where id = new.case_id and lifecycle_status = 'open';

  get diagnostics v_updated = row_count;

  if v_updated > 0 then
    insert into public.case_lifecycle_events (
      case_id, from_status, to_status, actor_id, note, reason, meta
    ) values (
      new.case_id,
      'open',
      'discussion',
      new.author_id,
      'Первый комментарий',
      'Первый комментарий',
      jsonb_build_object('action', 'auto_discussion', 'comment_id', new.id)
    );

    insert into public.clinical_platform_audit_events (
      actor_id, action, entity_type, entity_id, metadata
    ) values (
      new.author_id,
      'case.lifecycle.auto_discussion',
      'case',
      new.case_id,
      jsonb_build_object('from_status', 'open', 'to_status', 'discussion')
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Internal audit writer (security definer)
-- ---------------------------------------------------------------------------
create or replace function public.write_clinical_platform_audit(
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_request_id text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = p_actor_id;
  insert into public.clinical_platform_audit_events (
    actor_id, actor_role, action, entity_type, entity_id, request_id, metadata
  ) values (
    p_actor_id, v_role, p_action, p_entity_type, p_entity_id, p_request_id, p_metadata
  );
end;
$$;

revoke all on function public.write_clinical_platform_audit(uuid, text, text, uuid, text, jsonb) from public;
grant execute on function public.write_clinical_platform_audit(uuid, text, text, uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Lifecycle transition RPC (extended)
-- ---------------------------------------------------------------------------
drop function if exists public.transition_case_lifecycle(uuid, text, text, text, text, text);

create or replace function public.transition_case_lifecycle(
  p_case_id uuid,
  p_action text,
  p_confirmation_method text default null,
  p_confirmation_method_other text default null,
  p_confirmed_diagnosis text default null,
  p_note text default null,
  p_request_id text default null,
  p_idempotency_key text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case public.cases%rowtype;
  v_from text;
  v_to text;
  v_actor uuid := auth.uid();
  v_existing uuid;
begin
  if v_actor is null then
    raise exception 'unauthenticated' using errcode = '42501';
  end if;

  if p_idempotency_key is not null then
    select id into v_existing
    from public.case_lifecycle_events
    where case_id = p_case_id and idempotency_key = p_idempotency_key
    limit 1;
    if v_existing is not null then
      raise exception 'idempotent replay' using errcode = '23505';
    end if;
  end if;

  select * into v_case from public.cases where id = p_case_id for update;
  if not found then
    raise exception 'case not found' using errcode = 'P0002';
  end if;

  v_from := coalesce(v_case.lifecycle_status, 'open');
  perform set_config('app.lifecycle_transition', 'true', true);

  if p_action = 'resolve' then
    if v_case.user_id <> v_actor and not public.is_moderator() and not public.is_admin() then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if v_from not in ('open', 'discussion') then
      raise exception 'invalid transition' using errcode = '22023';
    end if;
    v_to := 'resolved';
    update public.cases
    set lifecycle_status = v_to, resolved_at = now(), updated_at = now()
    where id = p_case_id;

  elsif p_action = 'confirm' then
    if not public.is_case_expert(v_actor) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if v_from not in ('resolved', 'discussion') then
      raise exception 'invalid transition' using errcode = '22023';
    end if;
    if p_confirmation_method is null then
      raise exception 'confirmation_method required' using errcode = '22023';
    end if;
    if p_confirmation_method = 'other' and coalesce(trim(p_confirmation_method_other), '') = '' then
      raise exception 'confirmation_method_other required' using errcode = '22023';
    end if;
    if coalesce(length(trim(p_confirmed_diagnosis)), 0) < 3 then
      raise exception 'confirmed_diagnosis required' using errcode = '22023';
    end if;
    v_to := 'confirmed';
    update public.cases
    set
      lifecycle_status = v_to,
      confirmed_at = now(),
      confirmed_by = v_actor,
      expert_reviewer_id = v_actor,
      confirmation_method = p_confirmation_method,
      confirmation_method_other = p_confirmation_method_other,
      confirmed_diagnosis = p_confirmed_diagnosis,
      updated_at = now()
    where id = p_case_id;

  elsif p_action = 'archive' then
    if not public.can_moderate_case_discussion(v_actor) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    v_to := 'archived';
    update public.cases
    set lifecycle_status = v_to, updated_at = now()
    where id = p_case_id;

  elsif p_action = 'reopen' then
    if not public.can_moderate_case_discussion(v_actor) and v_case.user_id <> v_actor then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if v_from not in ('resolved', 'archived') then
      raise exception 'invalid transition' using errcode = '22023';
    end if;
    v_to := 'discussion';
    update public.cases
    set lifecycle_status = v_to, updated_at = now()
    where id = p_case_id;

  elsif p_action = 'publish_knowledge_base' then
    if not public.can_moderate_case_discussion(v_actor) then
      raise exception 'forbidden' using errcode = '42501';
    end if;
    if v_from <> 'confirmed' then
      raise exception 'invalid transition' using errcode = '22023';
    end if;
    v_to := 'confirmed';
    update public.cases
    set
      knowledge_base_at = now(),
      channel_id = null,
      status = 'published',
      is_public = true,
      updated_at = now()
    where id = p_case_id;

  else
    raise exception 'unknown action' using errcode = '22023';
  end if;

  insert into public.case_lifecycle_events (
    case_id, from_status, to_status, actor_id, note, reason, meta, request_id, idempotency_key
  ) values (
    p_case_id,
    v_from,
    v_to,
    v_actor,
    p_note,
    p_note,
    jsonb_build_object(
      'action', p_action,
      'confirmation_method', p_confirmation_method
    ),
    p_request_id,
    p_idempotency_key
  );

  perform public.write_clinical_platform_audit(
    v_actor,
    'case.lifecycle.' || p_action,
    'case',
    p_case_id,
    p_request_id,
    jsonb_build_object('from_status', v_from, 'to_status', v_to)
  );
end;
$$;

revoke all on function public.transition_case_lifecycle(uuid, text, text, text, text, text, text, text) from public;
grant execute on function public.transition_case_lifecycle(uuid, text, text, text, text, text, text, text) to authenticated;

commit;

-- ========== 20260910190000_protocol_lifecycle_hardening.sql ==========
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

-- ========== 20260910200000_security_audit_insert_fix.sql ==========
-- Allow server-side security audit inserts via security definer RPC (not direct client insert).

begin;

create or replace function public.insert_security_audit_event(
  p_category text,
  p_action text,
  p_resource text default null,
  p_resource_id text default null,
  p_success boolean default true,
  p_metadata jsonb default '{}'::jsonb,
  p_request_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
begin
  if v_actor is not null then
    select role into v_role from public.profiles where id = v_actor;
  end if;

  insert into public.security_audit_log (
    actor_id, actor_role, ip_hash, user_agent,
    category, action, resource, resource_id, success, metadata
  ) values (
    v_actor, v_role, '', '',
    p_category, p_action, p_resource, p_resource_id, p_success,
    p_metadata || jsonb_build_object('request_id', p_request_id)
  );
end;
$$;

revoke all on function public.insert_security_audit_event(text, text, text, text, boolean, jsonb, text) from public;
grant execute on function public.insert_security_audit_event(text, text, text, text, boolean, jsonb, text) to authenticated;

commit;
