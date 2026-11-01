-- Richer doctor display names for chat roster (FIO / specialization / public №).
-- Also labels the shared open-access / guest accounts as «Гость».

do $migration$
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;

  -- Prefer readable names for shared demo identities used before personal login.
  if to_regclass('public.users') is not null then
    update public.profiles p
    set full_name = 'Гость'
    from public.users u
    where u.id = p.id
      and lower(u.email) in ('open-access@sonogyn.pro', 'chat-guest@sonogyn.pro')
      and (p.full_name is null or trim(p.full_name) = '' or p.full_name = 'Открытый доступ');
  end if;

  execute 'drop function if exists public.get_doctor_display_names(uuid[])';

  execute $fn$
    create or replace function public.get_doctor_display_names(p_user_ids uuid[])
    returns table (id uuid, full_name text, email text, specialization text)
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
        coalesce(nullif(trim(p.specialization), ''), nullif(trim(u.specialization), '')) as specialization
      from public.profiles p
      left join public.users u on u.id = p.id
      where p.id = any (p_user_ids)
        and auth.uid() is not null;
    $body$;
  $fn$;

  execute 'revoke all on function public.get_doctor_display_names(uuid[]) from public';
  execute 'grant execute on function public.get_doctor_display_names(uuid[]) to authenticated';
end
$migration$;
