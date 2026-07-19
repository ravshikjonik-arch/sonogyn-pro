-- Block privilege / billing self-escalation via profiles UPDATE (RLS allows own row, not column guard).

create or replace function public.guard_profiles_sensitive_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
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

  return new;
end;
$$;

drop trigger if exists trg_guard_profiles_sensitive on public.profiles;
create trigger trg_guard_profiles_sensitive
  before update on public.profiles
  for each row execute function public.guard_profiles_sensitive_update();

comment on function public.guard_profiles_sensitive_update() is
  'Prevents non-admin users from self-granting admin/author role or PRO subscription via direct Supabase client.';
