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
