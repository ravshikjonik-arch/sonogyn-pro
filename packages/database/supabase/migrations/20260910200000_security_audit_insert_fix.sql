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
