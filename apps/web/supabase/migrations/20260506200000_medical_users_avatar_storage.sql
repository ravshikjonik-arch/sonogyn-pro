-- Doctor profile row in public.users (1:1 with auth.users).
-- RBAC / billing remains on public.profiles; clinical-facing identity fields sync here.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  specialization text,
  institution text,
  avatar_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_email_idx on public.users (email);

alter table public.users enable row level security;

drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users for select using (auth.uid() = id or public.is_admin());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users for update using (auth.uid() = id or public.is_admin());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users for insert with check (auth.uid() = id);

-- Extend signup trigger: profiles (RBAC) + users (doctor-facing row)
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  fn text := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''), '');
  sp text := nullif(trim(coalesce(new.raw_user_meta_data->>'specialization', '')), '');
  ins text := nullif(trim(coalesce(new.raw_user_meta_data->>'institution', '')), '');
begin
  insert into public.profiles (id, full_name, specialization, institution, trial_ends_at)
  values (new.id, fn, sp, ins, now() + interval '7 days')
  on conflict (id) do nothing;

  insert into public.users (id, email, full_name, specialization, institution)
  values (
    new.id,
    coalesce(new.email, ''),
    fn,
    sp,
    ins
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.users.full_name end,
    specialization = coalesce(excluded.specialization, public.users.specialization),
    institution = coalesce(excluded.institution, public.users.institution),
    updated_at = now();

  return new;
end;
$$;

-- Backfill from auth + profiles for existing accounts
insert into public.users (id, email, full_name, specialization, institution)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(nullif(trim(p.full_name), ''), ''),
  p.specialization,
  p.institution
from auth.users u
left join public.profiles p on p.id = u.id
on conflict (id) do nothing;

-- Private avatars: path convention {user_id}/avatar
insert into storage.buckets (id, name, public)
values ('clinical-avatars', 'clinical-avatars', false)
on conflict (id) do nothing;

drop policy if exists clinical_avatars_select_own on storage.objects;
create policy clinical_avatars_select_own on storage.objects for select to authenticated using (
  bucket_id = 'clinical-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists clinical_avatars_insert_own on storage.objects;
create policy clinical_avatars_insert_own on storage.objects for insert to authenticated with check (
  bucket_id = 'clinical-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists clinical_avatars_update_own on storage.objects;
create policy clinical_avatars_update_own on storage.objects for update to authenticated using (
  bucket_id = 'clinical-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists clinical_avatars_delete_own on storage.objects;
create policy clinical_avatars_delete_own on storage.objects for delete to authenticated using (
  bucket_id = 'clinical-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

comment on table public.users is 'Physician profile (app-facing); synced with auth signup metadata and PATCH /api/profile.';
