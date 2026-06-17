-- Год рождения врача (обязательное поле при регистрации / dev-login).

alter table public.profiles
  add column if not exists birth_year smallint
  check (birth_year is null or (birth_year >= 1900 and birth_year <= 2100));

alter table public.users
  add column if not exists birth_year smallint
  check (birth_year is null or (birth_year >= 1900 and birth_year <= 2100));

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
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

  insert into public.profiles (id, full_name, specialization, institution, birth_year, trial_ends_at)
  values (new.id, fn, sp, ins, by_val, now() + interval '7 days')
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
