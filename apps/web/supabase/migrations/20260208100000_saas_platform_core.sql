-- SaaS platform core: profiles (RBAC + billing), teaching cases, AI analyses,
-- calculators catalog, Stripe subscriptions, analytics_events, audit_log.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  full_name text,
  institution text,
  specialization text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro')),
  subscription_expires_at timestamptz,
  stripe_customer_id text unique,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_stripe_customer_idx on public.profiles (stripe_customer_id);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  anatomy text,
  pathology text,
  difficulty text,
  is_public boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'review', 'published', 'flagged')),
  flag_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cases_user_idx on public.cases (user_id);
create index if not exists cases_status_public_idx on public.cases (status, is_public);

create table if not exists public.case_media (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video', 'dicom')),
  order_index int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  uploaded_at timestamptz not null default now()
);

create index if not exists case_media_case_idx on public.case_media (case_id);

create table if not exists public.ai_analyses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  results jsonb,
  error_message text,
  requested_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists ai_analyses_case_idx on public.ai_analyses (case_id);
create index if not exists ai_analyses_status_idx on public.ai_analyses (status);

create table if not exists public.calculators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  formula_config jsonb not null default '{}'::jsonb,
  inputs jsonb not null default '{}'::jsonb,
  outputs jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calculator_id uuid references public.calculators (id) on delete set null,
  input_values jsonb not null default '{}'::jsonb,
  output_values jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_customer_id text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  timestamp timestamptz not null default now()
);

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, trial_ends_at)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), now() + interval '7 days')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users for each row execute function public.handle_new_user_profile();

create or replace function public.write_audit_log()
returns trigger language plpgsql security definer set search_path = public as $$
declare rid text;
begin
  rid := coalesce(case when tg_op = 'DELETE' then old.id::text else new.id::text end, null);
  insert into public.audit_log (user_id, action, table_name, record_id, old_data, new_data)
  values (
    auth.uid(), tg_op, tg_table_name, rid,
    case when tg_op in ('UPDATE', 'DELETE') then row_to_json(old) else null end,
    case when tg_op in ('UPDATE', 'INSERT') then row_to_json(new) else null end
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles after insert or update or delete on public.profiles
  for each row execute function public.write_audit_log();

drop trigger if exists audit_cases on public.cases;
create trigger audit_cases after insert or update or delete on public.cases
  for each row execute function public.write_audit_log();

drop trigger if exists audit_subscriptions on public.subscriptions;
create trigger audit_subscriptions after insert or update or delete on public.subscriptions
  for each row execute function public.write_audit_log();

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.case_media enable row level security;
alter table public.ai_analyses enable row level security;
alter table public.calculators enable row level security;
alter table public.saved_results enable row level security;
alter table public.subscriptions enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_log enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select using (auth.uid() = id or public.is_admin());
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (auth.uid() = id or public.is_admin());
drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert with check (auth.uid() = id);

drop policy if exists cases_select_policy on public.cases;
create policy cases_select_policy on public.cases for select using (
  public.is_admin() or user_id = auth.uid() or (status = 'published' and is_public = true)
);
drop policy if exists cases_insert_own on public.cases;
create policy cases_insert_own on public.cases for insert with check (user_id = auth.uid());
drop policy if exists cases_update_own on public.cases;
create policy cases_update_own on public.cases for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists cases_delete_own on public.cases;
create policy cases_delete_own on public.cases for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists case_media_select on public.case_media;
create policy case_media_select on public.case_media for select using (
  public.is_admin() or exists (
    select 1 from public.cases c where c.id = case_media.case_id
      and (c.user_id = auth.uid() or (c.status = 'published' and c.is_public = true))
  )
);
drop policy if exists case_media_write on public.case_media;
create policy case_media_write on public.case_media for all using (
  public.is_admin() or exists (select 1 from public.cases c where c.id = case_media.case_id and c.user_id = auth.uid())
) with check (
  public.is_admin() or exists (select 1 from public.cases c where c.id = case_media.case_id and c.user_id = auth.uid())
);

drop policy if exists ai_analyses_select on public.ai_analyses;
create policy ai_analyses_select on public.ai_analyses for select using (
  public.is_admin() or exists (select 1 from public.cases c where c.id = ai_analyses.case_id and c.user_id = auth.uid())
);
drop policy if exists ai_analyses_insert on public.ai_analyses;
create policy ai_analyses_insert on public.ai_analyses for insert with check (
  exists (select 1 from public.cases c where c.id = ai_analyses.case_id and c.user_id = auth.uid()) or public.is_admin()
);
drop policy if exists ai_analyses_update on public.ai_analyses;
create policy ai_analyses_update on public.ai_analyses for update using (
  public.is_admin() or exists (select 1 from public.cases c where c.id = ai_analyses.case_id and c.user_id = auth.uid())
);

drop policy if exists calculators_select on public.calculators;
create policy calculators_select on public.calculators for select to authenticated using (true);
drop policy if exists calculators_write_admin on public.calculators;
create policy calculators_write_admin on public.calculators for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists saved_results_own on public.saved_results;
create policy saved_results_own on public.saved_results for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists subscriptions_own on public.subscriptions;
create policy subscriptions_own on public.subscriptions for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists analytics_insert on public.analytics_events;
create policy analytics_insert on public.analytics_events for insert with check (auth.uid() = user_id or user_id is null);
drop policy if exists analytics_select_admin on public.analytics_events;
create policy analytics_select_admin on public.analytics_events for select using (public.is_admin() or auth.uid() = user_id);

drop policy if exists audit_select_admin on public.audit_log;
create policy audit_select_admin on public.audit_log for select using (public.is_admin());

comment on table public.cases is 'Teaching gallery — anonymized educational cases only.';
