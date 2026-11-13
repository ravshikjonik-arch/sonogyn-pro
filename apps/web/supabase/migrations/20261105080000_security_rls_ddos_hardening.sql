-- SECURITY: Stage 2 RLS hardening (idempotent).
-- - Re-assert profiles SELECT = self/admin only (no USING (true) roster).
-- - PHI storage buckets must stay private (signed URLs only).
-- - user_metadata locked to service_role (no authenticated policies).
-- - Audit RPC: tighten forgery surface; keep authenticated execute (server routes use user JWT).
-- Apply on staging first; then prod with explicit GO.

-- ========== profiles ==========
do $sec$
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;

  execute 'drop policy if exists profiles_select_authenticated on public.profiles';
  execute 'drop policy if exists profiles_select_roster on public.profiles';
  execute 'drop policy if exists profiles_select_self on public.profiles';

  execute $pol$
    create policy profiles_select_self on public.profiles
      for select to authenticated
      using (auth.uid() = id or public.is_admin())
  $pol$;
end
$sec$;

-- ========== user_metadata (email/phone lookup) ==========
do $sec$
begin
  if to_regclass('public.user_metadata') is null then
    return;
  end if;

  execute 'alter table public.user_metadata enable row level security';
  execute 'revoke all on table public.user_metadata from anon, authenticated';
  execute 'grant select, insert, update, delete on table public.user_metadata to service_role';
end
$sec$;

-- ========== PHI / clinical storage buckets ==========
do $sec$
declare
  bid text;
begin
  foreach bid in array array[
    'ultrasound-media',
    'verifications',
    'doctor-chat-media',
    'teaching_case_media',
    'teaching-case-media',
    'medical-source-vault'
  ]
  loop
    update storage.buckets
      set public = false
      where id = bid and coalesce(public, true) = true;
  end loop;
end
$sec$;

-- ========== security audit RPC hardening ==========
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
  v_category text := lower(trim(coalesce(p_category, '')));
  v_action text := left(trim(coalesce(p_action, '')), 200);
begin
  -- SECURITY: only known categories; actor always from JWT (not client-supplied).
  if v_category not in ('auth', 'admin', 'webhook', 'author', 'moderation', 'report') then
    raise exception 'invalid audit category' using errcode = '22023';
  end if;
  if length(v_action) < 2 then
    raise exception 'invalid audit action' using errcode = '22023';
  end if;

  if v_actor is not null then
    select role into v_role from public.profiles where id = v_actor;
  end if;

  insert into public.security_audit_log (
    actor_id, actor_role, ip_hash, user_agent,
    category, action, resource, resource_id, success, metadata
  ) values (
    v_actor, v_role, '', '',
    v_category, v_action,
    left(coalesce(p_resource, ''), 200),
    left(coalesce(p_resource_id, ''), 200),
    coalesce(p_success, true),
    coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('request_id', p_request_id)
  );
end;
$$;

revoke all on function public.insert_security_audit_event(text, text, text, text, boolean, jsonb, text) from public;
revoke all on function public.insert_security_audit_event(text, text, text, text, boolean, jsonb, text) from anon;
grant execute on function public.insert_security_audit_event(text, text, text, text, boolean, jsonb, text) to authenticated;
grant execute on function public.insert_security_audit_event(text, text, text, text, boolean, jsonb, text) to service_role;

comment on function public.insert_security_audit_event(text, text, text, text, boolean, jsonb, text) is
  'SECURITY: category allowlist; actor from auth.uid(); no anon execute.';

-- Intentional USING (true) SELECT (product, not PHI) — do not tighten blindly:
-- doctor_chat_channels/messages, doctor_presence, calculators catalog, reputation_events ledger.
-- Community roster names: public.get_author_public_badges / get_doctor_display_names.

-- ========== Stripe webhook idempotency ==========
create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  received_at timestamptz not null default now()
);

alter table public.stripe_webhook_events enable row level security;

revoke all on table public.stripe_webhook_events from anon, authenticated;
grant select, insert on table public.stripe_webhook_events to service_role;

comment on table public.stripe_webhook_events is
  'SECURITY: processed Stripe event ids — prevent double fulfill on retries.';
