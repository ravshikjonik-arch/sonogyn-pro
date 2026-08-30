-- Prevent privilege/billing self-escalation on public.profiles.
--
-- The RLS policy `profiles_update_self` (20260208100000_saas_platform_core.sql) allows a user to
-- UPDATE their own profile row. RLS cannot restrict *which columns* change, so a malicious client
-- could call supabase.from('profiles').update({ role: 'admin' }) (or subscription_tier: 'pro') and
-- escalate privileges / unlock PRO features, bypassing /api/profile and the /admin middleware.
--
-- This BEFORE UPDATE trigger keeps privileged columns immutable for self-service updates while
-- still allowing:
--   * server/service-role contexts (Stripe webhook, admin tooling) — they have no auth.uid();
--   * admins (public.is_admin()).
-- Non-privileged self-service fields (full_name, institution, specialization) are unaffected, so
-- the existing /api/profile PATCH flow keeps working.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role / server contexts have no auth.uid(); admins are explicitly trusted.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  -- Self-service update: force privileged columns back to their stored values.
  new.role := old.role;
  new.subscription_tier := old.subscription_tier;
  new.subscription_expires_at := old.subscription_expires_at;
  new.stripe_customer_id := old.stripe_customer_id;
  new.trial_ends_at := old.trial_ends_at;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row
  execute function public.protect_profile_privileged_columns();

comment on function public.protect_profile_privileged_columns() is
  'Keeps role/subscription/stripe columns immutable for self-service profile updates; service-role and admins bypass.';
