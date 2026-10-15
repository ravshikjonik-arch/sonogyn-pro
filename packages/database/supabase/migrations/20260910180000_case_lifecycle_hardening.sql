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
