-- Chat display identity: FIO (default) or optional nickname chosen at registration / profile.
-- Backward compatible: existing users keep chat_name_mode = 'fio'.

do $migration$
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;

  alter table public.profiles
    add column if not exists chat_nickname text,
    add column if not exists chat_name_mode text not null default 'fio';

  -- Soft check without failing older rows that somehow got empty mode.
  update public.profiles
  set chat_name_mode = 'fio'
  where chat_name_mode is null
     or trim(chat_name_mode) = ''
     or chat_name_mode not in ('fio', 'nick');

  alter table public.profiles
    drop constraint if exists profiles_chat_name_mode_check;

  alter table public.profiles
    add constraint profiles_chat_name_mode_check
    check (chat_name_mode in ('fio', 'nick'));

  comment on column public.profiles.chat_nickname is
    'Optional public nickname for doctor chat (when chat_name_mode = nick).';
  comment on column public.profiles.chat_name_mode is
    'Chat roster label: fio (abbreviated full_name) or nick (chat_nickname).';

  -- Extend signup trigger to persist chat identity from auth metadata.
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user_profile'
  ) then
    execute $fn$
      create or replace function public.handle_new_user_profile()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $body$
      declare
        fn text := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''), '');
        sp text := nullif(trim(coalesce(new.raw_user_meta_data->>'specialization', '')), '');
        ins text := nullif(trim(coalesce(new.raw_user_meta_data->>'institution', '')), '');
        by_raw text := nullif(trim(coalesce(new.raw_user_meta_data->>'birth_year', '')), '');
        by_val smallint := null;
        nick text := nullif(trim(coalesce(new.raw_user_meta_data->>'chat_nickname', '')), '');
        mode text := lower(coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'chat_name_mode', '')), ''), 'fio'));
      begin
        if by_raw ~ '^\d{4}$' then
          by_val := by_raw::smallint;
        end if;

        if mode not in ('fio', 'nick') then
          mode := 'fio';
        end if;
        if mode = 'nick' and nick is null then
          mode := 'fio';
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
          cases_count,
          chat_nickname,
          chat_name_mode
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
          0,
          nick,
          mode
        )
        on conflict (id) do update set
          full_name = case
            when excluded.full_name <> '' then excluded.full_name
            else public.profiles.full_name
          end,
          specialization = coalesce(excluded.specialization, public.profiles.specialization),
          institution = coalesce(excluded.institution, public.profiles.institution),
          birth_year = coalesce(excluded.birth_year, public.profiles.birth_year),
          chat_nickname = coalesce(excluded.chat_nickname, public.profiles.chat_nickname),
          chat_name_mode = case
            when excluded.chat_name_mode in ('fio', 'nick') then excluded.chat_name_mode
            else public.profiles.chat_name_mode
          end;

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
          birth_year = coalesce(excluded.birth_year, public.users.birth_year);

        return new;
      end;
      $body$;
    $fn$;
  end if;

  execute 'drop function if exists public.get_doctor_display_names(uuid[])';

  execute $rpc$
    create or replace function public.get_doctor_display_names(p_user_ids uuid[])
    returns table (
      id uuid,
      full_name text,
      email text,
      specialization text,
      chat_nickname text,
      chat_name_mode text
    )
    language sql
    security definer
    set search_path = public
    stable
    as $body$
      select
        p.id,
        coalesce(
          nullif(trim(p.full_name), ''),
          nullif(trim(u.full_name), ''),
          case
            when lower(coalesce(u.email, '')) in ('open-access@sonogyn.pro', 'chat-guest@sonogyn.pro')
              then 'Гость'
            else null
          end
        ) as full_name,
        u.email,
        coalesce(nullif(trim(p.specialization), ''), nullif(trim(u.specialization), '')) as specialization,
        nullif(trim(p.chat_nickname), '') as chat_nickname,
        coalesce(nullif(trim(p.chat_name_mode), ''), 'fio') as chat_name_mode
      from public.profiles p
      left join public.users u on u.id = p.id
      where p.id = any (p_user_ids)
        and auth.uid() is not null;
    $body$;
  $rpc$;

  execute 'revoke all on function public.get_doctor_display_names(uuid[]) from public';
  execute 'revoke all on function public.get_doctor_display_names(uuid[]) from anon';
  execute 'grant execute on function public.get_doctor_display_names(uuid[]) to authenticated';
end
$migration$;
