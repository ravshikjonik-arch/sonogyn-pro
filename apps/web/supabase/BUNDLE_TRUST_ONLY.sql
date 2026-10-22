-- SonoGyn Pro · все миграции (порядок по имени файла)
-- Supabase Dashboard → SQL Editor → вставить и Run
-- Сгенерировано: 2026-10-22T17:23:47.997Z

-- ========== 20261022160000_case_reputation_votes.sql ==========
-- Case votes (verified doctors only), case rating cache, reputation recalc (STEP 3).

alter table public.cases
  add column if not exists vote_up_count integer not null default 0,
  add column if not exists vote_down_count integer not null default 0,
  add column if not exists rating integer not null default 0;

alter table public.cases
  drop constraint if exists cases_vote_counts_nonneg;

alter table public.cases
  add constraint cases_vote_counts_nonneg check (
    vote_up_count >= 0 and vote_down_count >= 0
  );

comment on column public.cases.rating is 'vote_up_count − vote_down_count; пересчитывается триггером case_votes.';

alter table public.reputation_events
  add column if not exists actor_id uuid references auth.users (id) on delete set null;

comment on column public.reputation_events.actor_id is
  'Инициатор (например voter_id для case_upvote / vote_retracted).';

-- Несколько пар case_upvote / vote_retracted на одного voter+case допустимы (повторный голос после снятия).

-- ---------------------------------------------------------------------------
-- case_votes
-- ---------------------------------------------------------------------------
create table if not exists public.case_votes (
  case_id uuid not null references public.cases (id) on delete cascade,
  voter_id uuid not null references auth.users (id) on delete cascade,
  vote smallint not null check (vote in (1, -1)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (case_id, voter_id)
);

create index if not exists case_votes_voter_idx on public.case_votes (voter_id);

alter table public.case_votes enable row level security;

drop policy if exists case_votes_select on public.case_votes;
create policy case_votes_select on public.case_votes
  for select to authenticated
  using (public.can_view_teaching_case(case_id));

-- Writes only via cast_case_vote() (security definer).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.profile_is_verified(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_verified from public.profiles p where p.id = p_user_id),
    false
  );
$$;

revoke all on function public.profile_is_verified(uuid) from public;
grant execute on function public.profile_is_verified(uuid) to authenticated;

create or replace function public.sync_case_rating(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_up int;
  v_down int;
begin
  select
    count(*) filter (where vote = 1),
    count(*) filter (where vote = -1)
  into v_up, v_down
  from public.case_votes
  where case_id = p_case_id;

  update public.cases
  set
    vote_up_count = coalesce(v_up, 0),
    vote_down_count = coalesce(v_down, 0),
    rating = coalesce(v_up, 0) - coalesce(v_down, 0)
  where id = p_case_id;
end;
$$;

create or replace function public.recalculate_reputation(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rep integer;
  v_cases integer;
  v_row public.profiles;
begin
  if p_user_id is null then
    raise exception 'user_id required' using errcode = '22023';
  end if;

  select coalesce(sum(points), 0)::integer into v_rep
  from public.reputation_events
  where user_id = p_user_id;

  select count(*)::integer into v_cases
  from public.cases
  where user_id = p_user_id
    and status = 'published';

  update public.profiles
  set
    reputation = greatest(v_rep, 0),
    cases_count = v_cases,
    updated_at = now()
  where id = p_user_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.recalculate_reputation(uuid) from public;
grant execute on function public.recalculate_reputation(uuid) to service_role;

create or replace function public.cast_case_vote(p_case_id uuid, p_vote smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_voter uuid := auth.uid();
  v_author uuid;
  v_old smallint;
begin
  if v_voter is null then
    raise exception 'auth required' using errcode = '42501';
  end if;

  if p_vote not in (-1, 0, 1) then
    raise exception 'invalid vote' using errcode = '22023';
  end if;

  if not public.profile_is_verified(v_voter) then
    raise exception 'only verified doctors can vote' using errcode = '42501';
  end if;

  select c.user_id into v_author
  from public.cases c
  where c.id = p_case_id;

  if v_author is null then
    raise exception 'case not found' using errcode = 'P0002';
  end if;

  if not public.can_view_teaching_case(p_case_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select cv.vote into v_old
  from public.case_votes cv
  where cv.case_id = p_case_id and cv.voter_id = v_voter;

  if coalesce(v_old, 0) = 1 then
    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'vote_retracted', -2, p_case_id, v_voter);
  end if;

  if p_vote = 0 then
    delete from public.case_votes
    where case_id = p_case_id and voter_id = v_voter;
  elsif v_old is null then
    insert into public.case_votes (case_id, voter_id, vote)
    values (p_case_id, v_voter, p_vote);
  else
    update public.case_votes
    set vote = p_vote, updated_at = now()
    where case_id = p_case_id and voter_id = v_voter;
  end if;

  if p_vote = 1 and coalesce(v_old, 0) <> 1 then
    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'case_upvote', 2, p_case_id, v_voter);
  end if;

  perform public.sync_case_rating(p_case_id);
  perform public.recalculate_reputation(v_author);

  return jsonb_build_object(
    'case_id', p_case_id,
    'vote', case when p_vote = 0 then null else p_vote end
  );
end;
$$;

revoke all on function public.cast_case_vote(uuid, smallint) from public;
grant execute on function public.cast_case_vote(uuid, smallint) to authenticated;

create or replace function public.award_case_featured(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author uuid;
begin
  if not public.is_admin() and not public.is_moderator() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select user_id into v_author from public.cases where id = p_case_id;
  if v_author is null then
    raise exception 'case not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.reputation_events
    where user_id = v_author and event_type = 'case_featured' and reference_id = p_case_id
  ) then
    return;
  end if;

  insert into public.reputation_events (user_id, event_type, points, reference_id)
  values (v_author, 'case_featured', 25, p_case_id);

  perform public.recalculate_reputation(v_author);
end;
$$;

revoke all on function public.award_case_featured(uuid) from public;
grant execute on function public.award_case_featured(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Publish → +10 reputation (once per case)
-- ---------------------------------------------------------------------------
create or replace function public.trg_award_case_published_reputation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (
    tg_op = 'UPDATE'
    and old.status is distinct from 'published'
    and new.status = 'published'
  ) or (
    tg_op = 'INSERT'
    and new.status = 'published'
  ) then
    if not exists (
      select 1
      from public.reputation_events e
      where e.user_id = new.user_id
        and e.event_type = 'case_published'
        and e.reference_id = new.id
    ) then
      insert into public.reputation_events (user_id, event_type, points, reference_id)
      values (new.user_id, 'case_published', 10, new.id);
      perform public.recalculate_reputation(new.user_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cases_published_reputation on public.cases;
create trigger trg_cases_published_reputation
  after insert or update of status on public.cases
  for each row execute function public.trg_award_case_published_reputation();

-- Safety net: keep rating in sync if votes mutated via service_role
create or replace function public.trg_case_votes_sync_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case uuid;
begin
  v_case := coalesce(new.case_id, old.case_id);
  perform public.sync_case_rating(v_case);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_case_votes_sync_rating on public.case_votes;
create trigger trg_case_votes_sync_rating
  after insert or update or delete on public.case_votes
  for each row execute function public.trg_case_votes_sync_rating();

-- ========== 20261022170000_reputation_hardening.sql ==========
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

-- ========== 20261022180000_comment_upvote_dedupe.sql ==========
-- Idempotent comment 👍 reputation: не дублировать +1 без промежуточного −1.

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
  v_has_active_credit boolean;
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

  select exists (
    select 1
    from public.reputation_events e
    where e.event_type = 'comment_upvote'
      and e.actor_id = v_voter
      and e.reference_id = p_comment_id
      and not exists (
        select 1
        from public.reputation_events r
        where r.event_type = 'vote_retracted'
          and r.actor_id = v_voter
          and r.reference_id = p_comment_id
          and r.created_at > e.created_at
      )
  ) into v_has_active_credit;

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

    if v_has_active_credit then
      return;
    end if;

    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'comment_upvote', 1, p_comment_id, v_voter);
  else
    if not v_has_active_credit then
      return;
    end if;

    insert into public.reputation_events (user_id, event_type, points, reference_id, actor_id)
    values (v_author, 'vote_retracted', -1, p_comment_id, v_voter);
  end if;

  perform public.recalculate_reputation(v_author);
end;
$$;

-- ========== 20261022_verification_reputation.sql ==========
-- Doctor verification queue + reputation audit log (STEP 1).
-- Teaching cases feed: public.cases (author = user_id), likes: teaching_case_likes.
-- Coexists with medical_access_gate (medical_access_status / verified_doctor).

-- ---------------------------------------------------------------------------
-- profiles: trust fields (specialization already exists on profiles)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_verified boolean not null default false;

alter table public.profiles
  add column if not exists reputation integer not null default 0;

alter table public.profiles
  add column if not exists cases_count integer not null default 0;

alter table public.profiles
  drop constraint if exists profiles_reputation_nonneg;

alter table public.profiles
  add constraint profiles_reputation_nonneg check (reputation >= 0);

alter table public.profiles
  drop constraint if exists profiles_cases_count_nonneg;

alter table public.profiles
  add constraint profiles_cases_count_nonneg check (cases_count >= 0);

comment on column public.profiles.is_verified is
  'Подтверждённый врач (диплом/модерация). Не менять с клиента — только service_role / admin RPC.';
comment on column public.profiles.reputation is
  'Кэш суммы reputation_events; пересчёт только через service_role / Edge Function.';
comment on column public.profiles.cases_count is
  'Кэш опубликованных teaching cases (public.cases status=published).';

-- Align legacy verified_doctor gate with new flag (one-time backfill).
update public.profiles
set is_verified = true
where medical_access_status = 'verified_doctor'
  and is_verified = false;

-- ---------------------------------------------------------------------------
-- doctor_verifications
-- ---------------------------------------------------------------------------
create table if not exists public.doctor_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'expired')),
  full_name text not null,
  birth_date date,
  specialization text not null,
  diploma_number text,
  diploma_file_path text,
  org_name text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  rejection_reason text,
  constraint doctor_verifications_rejection_when_rejected check (
    status <> 'rejected' or (rejection_reason is not null and length(trim(rejection_reason)) > 0)
  )
);

create index if not exists doctor_verifications_user_idx
  on public.doctor_verifications (user_id, submitted_at desc);

create index if not exists doctor_verifications_status_idx
  on public.doctor_verifications (status, submitted_at desc)
  where status = 'pending';

-- At most one pending or approved application per user (rejected → new row allowed).
create unique index if not exists doctor_verifications_one_active_per_user
  on public.doctor_verifications (user_id)
  where status in ('pending', 'approved');

comment on table public.doctor_verifications is
  'Заявки на подтверждение статуса врача; диплом в Storage bucket verifications.';

-- ---------------------------------------------------------------------------
-- reputation_events (append-only audit log)
-- ---------------------------------------------------------------------------
create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (
    event_type in (
      'case_published',
      'case_upvote',
      'comment_upvote',
      'case_featured',
      'moderation_penalty',
      'vote_retracted'
    )
  ),
  points integer not null,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists reputation_events_user_created_idx
  on public.reputation_events (user_id, created_at desc);

create index if not exists reputation_events_reference_idx
  on public.reputation_events (event_type, reference_id)
  where reference_id is not null;

comment on table public.reputation_events is
  'Аудит начислений репутации; строки не удаляются (vote_retracted вместо DELETE).';

-- ---------------------------------------------------------------------------
-- auth.users → profiles (extend existing trigger)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fn text := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''), '');
  sp text := nullif(trim(coalesce(new.raw_user_meta_data->>'specialization', '')), '');
  ins text := nullif(trim(coalesce(new.raw_user_meta_data->>'institution', '')), '');
  by_raw text := nullif(trim(coalesce(new.raw_user_meta_data->>'birth_year', '')), '');
  by_val smallint := null;
begin
  if by_raw ~ '^\d{4}$' then
    by_val := by_raw::smallint;
  end if;

  insert into public.profiles (
    id,
    full_name,
    specialization,
    institution,
    birth_year,
    trial_ends_at,
    is_verified,
    reputation,
    cases_count
  )
  values (
    new.id,
    fn,
    sp,
    ins,
    by_val,
    now() + interval '7 days',
    false,
    0,
    0
  )
  on conflict (id) do nothing;

  insert into public.users (id, email, full_name, specialization, institution, birth_year)
  values (
    new.id,
    coalesce(new.email, ''),
    fn,
    sp,
    ins,
    by_val
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.users.full_name end,
    specialization = coalesce(excluded.specialization, public.users.specialization),
    institution = coalesce(excluded.institution, public.users.institution),
    birth_year = coalesce(excluded.birth_year, public.users.birth_year),
    updated_at = now();

  return new;
end;
$$;

-- Block self-granting verification / reputation counters.
create or replace function public.guard_profiles_sensitive_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'profiles.role change forbidden' using errcode = '42501';
  end if;

  if new.subscription_tier is distinct from old.subscription_tier then
    raise exception 'profiles.subscription_tier change forbidden' using errcode = '42501';
  end if;

  if new.subscription_expires_at is distinct from old.subscription_expires_at then
    raise exception 'profiles.subscription_expires_at change forbidden' using errcode = '42501';
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id then
    raise exception 'profiles.stripe_customer_id change forbidden' using errcode = '42501';
  end if;

  if new.trial_ends_at is distinct from old.trial_ends_at then
    raise exception 'profiles.trial_ends_at change forbidden' using errcode = '42501';
  end if;

  if new.medical_access_status is distinct from old.medical_access_status then
    raise exception 'profiles.medical_access_status change forbidden' using errcode = '42501';
  end if;

  if new.medical_verified_at is distinct from old.medical_verified_at then
    raise exception 'profiles.medical_verified_at change forbidden' using errcode = '42501';
  end if;

  if new.medical_verified_by is distinct from old.medical_verified_by then
    raise exception 'profiles.medical_verified_by change forbidden' using errcode = '42501';
  end if;

  if new.medical_verification_note is distinct from old.medical_verification_note then
    raise exception 'profiles.medical_verification_note change forbidden' using errcode = '42501';
  end if;

  if new.is_verified is distinct from old.is_verified then
    raise exception 'profiles.is_verified change forbidden' using errcode = '42501';
  end if;

  if new.reputation is distinct from old.reputation then
    raise exception 'profiles.reputation change forbidden' using errcode = '42501';
  end if;

  if new.cases_count is distinct from old.cases_count then
    raise exception 'profiles.cases_count change forbidden' using errcode = '42501';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Admin moderation RPC (no direct client UPDATE on doctor_verifications)
-- ---------------------------------------------------------------------------
create or replace function public.review_doctor_verification(
  p_verification_id uuid,
  p_decision text,
  p_rejection_reason text default null
)
returns public.doctor_verifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.doctor_verifications;
  v_actor uuid := auth.uid();
begin
  if not public.is_admin() and auth.role() <> 'service_role' then
    raise exception 'review_doctor_verification forbidden' using errcode = '42501';
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
    reviewed_by = case when v_actor is null then reviewed_by else v_actor end,
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
      medical_verified_by = v_actor,
      medical_verification_note = 'doctor_verifications approved',
      updated_at = now()
    where id = v_row.user_id;
  end if;

  return v_row;
end;
$$;

revoke all on function public.review_doctor_verification(uuid, text, text) from public;
grant execute on function public.review_doctor_verification(uuid, text, text) to authenticated;

comment on function public.review_doctor_verification(uuid, text, text) is
  'Admin/service: approve/reject/expired pending verification; sets profiles.is_verified and medical_access_status.';

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.doctor_verifications enable row level security;
alter table public.reputation_events enable row level security;

drop policy if exists doctor_verifications_select_own on public.doctor_verifications;
create policy doctor_verifications_select_own on public.doctor_verifications
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists doctor_verifications_insert_own on public.doctor_verifications;
create policy doctor_verifications_insert_own on public.doctor_verifications
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and length(trim(full_name)) > 0
    and length(trim(specialization)) > 0
    and not exists (
      select 1
      from public.doctor_verifications dv
      where dv.user_id = auth.uid()
        and dv.status in ('pending', 'approved')
    )
  );

-- UPDATE/DELETE: no policies for authenticated → denied; service_role bypasses RLS.

drop policy if exists reputation_events_select_all on public.reputation_events;
create policy reputation_events_select_all on public.reputation_events
  for select to authenticated
  using (true);

-- INSERT/UPDATE/DELETE reputation_events: service_role only (no authenticated policies).

-- profiles: read reputation badges in case feed (per product spec).
drop policy if exists profiles_select_roster on public.profiles;
create policy profiles_select_authenticated on public.profiles
  for select to authenticated
  using (true);

-- profiles_update_self / guard trigger unchanged in spirit (existing policy name may vary).
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: private bucket for diploma uploads
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'verifications',
  'verifications',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists verifications_storage_insert_own on storage.objects;
create policy verifications_storage_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'verifications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists verifications_storage_select_own on storage.objects;
create policy verifications_storage_select_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verifications'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

drop policy if exists verifications_storage_delete_own on storage.objects;
create policy verifications_storage_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'verifications'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- Signed URLs (60s) for moderators: server-side only; no anon read policy.
