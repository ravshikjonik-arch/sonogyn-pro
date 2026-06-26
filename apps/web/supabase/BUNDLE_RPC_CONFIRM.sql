-- RPC confirm_teaching_case + PostgREST schema reload (idempotent)

create or replace function public.confirm_teaching_case(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  select role into v_role from public.profiles where id = auth.uid();
  if v_role not in ('moderator', 'admin') then
    raise exception 'forbidden';
  end if;
  update public.cases
  set
    lifecycle_status = 'confirmed',
    confirmed_at = now(),
    confirmed_by = auth.uid(),
    expert_reviewer_id = auth.uid(),
    updated_at = now()
  where id = p_case_id;
end;
$$;

revoke all on function public.confirm_teaching_case(uuid) from public;
grant execute on function public.confirm_teaching_case(uuid) to authenticated;

notify pgrst, 'reload schema';
