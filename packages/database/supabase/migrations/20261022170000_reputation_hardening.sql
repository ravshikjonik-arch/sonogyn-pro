-- STEP 4: comment 👍 reputation, moderation penalty, backfill, Storage read hardening.

-- ---------------------------------------------------------------------------
-- Comment 👍 → +1 автору (только verified voter); снятие → vote_retracted −1
-- ---------------------------------------------------------------------------
create or replace function public.apply_comment_thumb_reputation(
  p_comment_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter uuid := auth.uid();
  v_author uuid;
begin
  if v_voter is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if not public.profile_is_verified(v_voter) then
    raise exception 'only verified doctors can award comment reputation' using errcode = '42501';
  end if;

  select c.author_id into v_author
  from public.teaching_case_comments c
  where c.id = p_comment_id;

  if v_author is null then
    raise exception 'comment not found' using errcode = 'P0002';
  end if;

  if v_author = v_voter then
    return;
  end if;

  if p_active then
    if not exists (
      select 1
      from public.teaching_case_comment_reactions r
      where r.comment_id = p_comment_id
        and r.user_id = v_voter
        and r.emoji = '👍'
    ) then
      raise exception 'thumb reaction missing' using errcode = '22023';
    end if;

    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'comment_upvote', 1, p_comment_id, v_voter);
  else
    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'vote_retracted', -1, p_comment_id, v_voter);
  end if;

  perform public.recalculate_reputation(v_author);
end;
$$;

revoke all on function public.apply_comment_thumb_reputation(uuid, boolean) from public;
grant execute on function public.apply_comment_thumb_reputation(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Moderation penalty (−20), admin / moderator
-- ---------------------------------------------------------------------------
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
  if not public.is_admin() and not public.is_moderator() then
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
grant execute on function public.apply_moderation_penalty(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Service-role review (ADMIN_EMAILS via Next API + service client)
-- ---------------------------------------------------------------------------
create or replace function public.review_doctor_verification_svc(
  p_verification_id uuid,
  p_decision text,
  p_rejection_reason text default null,
  p_reviewer_id uuid default null
)
returns public.doctor_verifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.doctor_verifications;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role only' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected', 'expired') then
    raise exception 'invalid decision' using errcode = '22023';
  end if;

  if p_decision = 'rejected' and (p_rejection_reason is null or length(trim(p_rejection_reason)) = 0) then
    raise exception 'rejection_reason required' using errcode = '22023';
  end if;

  select * into v_row
  from public.doctor_verifications
  where id = p_verification_id
  for update;

  if not found then
    raise exception 'verification not found' using errcode = 'P0002';
  end if;

  if v_row.status <> 'pending' then
    raise exception 'verification not pending' using errcode = '22023';
  end if;

  update public.doctor_verifications
  set
    status = p_decision,
    reviewed_at = now(),
    reviewed_by = p_reviewer_id,
    rejection_reason = case when p_decision = 'rejected' then trim(p_rejection_reason) else null end
  where id = p_verification_id
  returning * into v_row;

  if p_decision = 'approved' then
    update public.profiles
    set
      is_verified = true,
      full_name = coalesce(nullif(trim(v_row.full_name), ''), full_name),
      specialization = coalesce(nullif(trim(v_row.specialization), ''), specialization),
      medical_access_status = 'verified_doctor',
      medical_verified_at = now(),
      medical_verified_by = p_reviewer_id,
      medical_verification_note = 'doctor_verifications approved',
      updated_at = now()
    where id = v_row.user_id;
  end if;

  return v_row;
end;
$$;

revoke all on function public.review_doctor_verification_svc(uuid, text, text, uuid) from public;
grant execute on function public.review_doctor_verification_svc(uuid, text, text, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Backfill reputation cache for all profiles (one-time / ops)
-- ---------------------------------------------------------------------------
create or replace function public.backfill_all_reputation()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_count integer := 0;
begin
  if auth.role() <> 'service_role' then
    raise exception 'service_role only' using errcode = '42501';
  end if;

  for v_id in select id from public.profiles loop
    perform public.recalculate_reputation(v_id);
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.backfill_all_reputation() from public;
grant execute on function public.backfill_all_reputation() to service_role;

-- ---------------------------------------------------------------------------
-- Storage: дипломы только через signed URL (убираем прямой SELECT в bucket)
-- ---------------------------------------------------------------------------
drop policy if exists verifications_storage_select_own on storage.objects;
