-- Medical access gate for SonoGyn Pro.
-- Separates platform/community access (student/resident/doctor) from service RBAC (user/author/moderator/admin).

alter table public.profiles
  add column if not exists medical_access_status text not null default 'pending'
    check (medical_access_status in ('pending', 'student', 'resident', 'doctor', 'verified_doctor', 'suspended')),
  add column if not exists medical_license_number text,
  add column if not exists medical_verified_at timestamptz,
  add column if not exists medical_verified_by uuid references auth.users (id) on delete set null,
  add column if not exists medical_verification_note text;

create index if not exists profiles_medical_access_status_idx
  on public.profiles (medical_access_status);

comment on column public.profiles.medical_access_status is
  'Clinical platform access tier: pending/student/resident/doctor/verified_doctor/suspended.';
comment on column public.profiles.medical_license_number is
  'Optional user-submitted license/accreditation reference for manual verification.';
comment on column public.profiles.medical_verified_at is
  'Timestamp of manual medical access verification.';
comment on column public.profiles.medical_verified_by is
  'Admin/moderator user who verified medical access.';

create or replace function public.has_clinical_platform_access(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and (
        p.role in ('admin', 'moderator', 'author')
        or p.medical_access_status in ('student', 'resident', 'doctor', 'verified_doctor')
      )
      and p.medical_access_status <> 'suspended'
  );
$$;

create or replace function public.has_doctor_community_access(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and (
        p.role in ('admin', 'moderator')
        or p.medical_access_status in ('resident', 'doctor', 'verified_doctor')
      )
      and p.medical_access_status <> 'suspended'
  );
$$;

revoke all on function public.has_clinical_platform_access(uuid) from public;
revoke all on function public.has_doctor_community_access(uuid) from public;
grant execute on function public.has_clinical_platform_access(uuid) to authenticated;
grant execute on function public.has_doctor_community_access(uuid) to authenticated;

create or replace function public.set_medical_access_status(
  p_user_id uuid,
  p_status text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'only admin can change medical access status' using errcode = '42501';
  end if;

  if p_status not in ('pending', 'student', 'resident', 'doctor', 'verified_doctor', 'suspended') then
    raise exception 'invalid medical access status' using errcode = '22023';
  end if;

  update public.profiles
  set
    medical_access_status = p_status,
    medical_verified_at = case
      when p_status in ('student', 'resident', 'doctor', 'verified_doctor') then now()
      else null
    end,
    medical_verified_by = case
      when p_status in ('student', 'resident', 'doctor', 'verified_doctor', 'suspended') then auth.uid()
      else null
    end,
    medical_verification_note = p_note,
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.set_medical_access_status(uuid, text, text) from public;
grant execute on function public.set_medical_access_status(uuid, text, text) to authenticated;

-- Harden doctor chat and roster: only residents/doctors/verified doctors plus moderators/admins.
drop policy if exists doctor_chat_channels_select on public.doctor_chat_channels;
create policy doctor_chat_channels_select on public.doctor_chat_channels
  for select to authenticated
  using (public.has_doctor_community_access());

drop policy if exists doctor_chat_messages_select on public.doctor_chat_messages;
create policy doctor_chat_messages_select on public.doctor_chat_messages
  for select to authenticated
  using (public.has_doctor_community_access());

drop policy if exists doctor_chat_messages_insert on public.doctor_chat_messages;
create policy doctor_chat_messages_insert on public.doctor_chat_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.has_doctor_community_access()
  );

drop policy if exists doctor_presence_select on public.doctor_presence;
create policy doctor_presence_select on public.doctor_presence
  for select to authenticated
  using (public.has_doctor_community_access());

drop policy if exists doctor_presence_upsert_self on public.doctor_presence;
create policy doctor_presence_upsert_self on public.doctor_presence
  for all to authenticated
  using (user_id = auth.uid() and public.has_doctor_community_access())
  with check (user_id = auth.uid() and public.has_doctor_community_access());

drop policy if exists profiles_select_roster on public.profiles;
create policy profiles_select_roster on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin() or public.has_doctor_community_access());

-- Harden media used inside doctor chat / case discussion composer.
drop policy if exists doctor_chat_media_select on storage.objects;
create policy doctor_chat_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'doctor-chat-media'
    and public.has_doctor_community_access()
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.doctor_chat_messages m
        where m.media_storage_path = name
      )
      or exists (
        select 1 from public.teaching_case_comments c
        where c.media_storage_path = name
      )
    )
  );

drop policy if exists doctor_chat_media_insert on storage.objects;
create policy doctor_chat_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'doctor-chat-media'
    and public.has_doctor_community_access()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists doctor_chat_media_delete on storage.objects;
create policy doctor_chat_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'doctor-chat-media'
    and public.has_doctor_community_access()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Prevent users from self-approving medical access via direct Supabase client.
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

  return new;
end;
$$;

comment on function public.guard_profiles_sensitive_update() is
  'Prevents non-admin users from self-granting RBAC, billing, or medical community access via direct Supabase client.';

comment on function public.has_clinical_platform_access(uuid) is
  'True for medical students/residents/doctors/verified doctors plus service roles, excluding suspended users.';
comment on function public.has_doctor_community_access(uuid) is
  'True for residents/doctors/verified doctors plus moderators/admins; used by doctor chat, roster, and chat media.';
comment on function public.set_medical_access_status(uuid, text, text) is
  'Admin-only verifier for medical platform access status.';
