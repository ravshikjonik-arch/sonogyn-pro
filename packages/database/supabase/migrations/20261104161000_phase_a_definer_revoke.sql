-- Phase A / SEC-P1-04: narrow triage — revoke client EXECUTE on dangerous DEFINER RPCs.
-- Not a mass revoke of all advisor ×65; only documented high-risk set.
-- Apply only after explicit GO (staging first).

-- Moderation penalty: was granted to authenticated (any logged-in caller).
-- Admin API must use service_role client; function allows service_role OR admin/moderator JWT.
create or replace function public.apply_moderation_penalty(
  p_user_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role'
     and not public.is_admin()
     and not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'reason required' using errcode = '22023';
  end if;

  insert into public.reputation_events (user_id, event_type, points, reference_id)
  values (p_user_id, 'moderation_penalty', -20, null);

  perform public.recalculate_reputation(p_user_id);
end;
$$;

revoke all on function public.apply_moderation_penalty(uuid, text) from public;
revoke all on function public.apply_moderation_penalty(uuid, text) from anon;
revoke all on function public.apply_moderation_penalty(uuid, text) from authenticated;
grant execute on function public.apply_moderation_penalty(uuid, text) to service_role;

-- Ops backfill: confirm service_role only (idempotent).
revoke all on function public.backfill_all_reputation() from public;
revoke all on function public.backfill_all_reputation() from anon;
revoke all on function public.backfill_all_reputation() from authenticated;
grant execute on function public.backfill_all_reputation() to service_role;

comment on function public.apply_moderation_penalty(uuid, text) is
  'Phase A: service_role only; Next admin route uses createServiceRoleClient after moderator gate.';
