-- Phase A / SEC-P1-01: restore profiles SELECT to self/admin; public badges via RPC.
-- Do NOT expose stripe/license/medical_access via this RPC.
-- Apply only after explicit GO (staging first).

drop policy if exists profiles_select_authenticated on public.profiles;
drop policy if exists profiles_select_roster on public.profiles;
drop policy if exists profiles_select_self on public.profiles;

create policy profiles_select_self on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

-- Public display fields for case feed / chat (no billing / license columns).
create or replace function public.get_author_public_badges(p_user_ids uuid[])
returns table (
  id uuid,
  full_name text,
  is_verified boolean,
  reputation integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    coalesce(nullif(trim(p.full_name), ''), 'Врач') as full_name,
    coalesce(p.is_verified, false) as is_verified,
    coalesce(p.reputation, 0)::integer as reputation
  from public.profiles p
  where p.id = any (p_user_ids)
    and auth.uid() is not null;
$$;

revoke all on function public.get_author_public_badges(uuid[]) from public;
revoke all on function public.get_author_public_badges(uuid[]) from anon;
grant execute on function public.get_author_public_badges(uuid[]) to authenticated;

comment on function public.get_author_public_badges(uuid[]) is
  'Phase A: authenticated roster badges (name/verified/reputation) without PII billing fields.';
