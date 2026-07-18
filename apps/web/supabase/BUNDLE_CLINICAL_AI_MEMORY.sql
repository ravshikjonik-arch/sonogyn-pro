-- SonoGyn Pro · Clinical AI Memory
-- Supabase Dashboard → SQL Editor → paste → Run
--
-- Physician-controlled visible memory:
-- - doctor can save distilled clinical learning/context;
-- - doctor can forget it by archiving;
-- - RLS keeps memory private to the account.

create table if not exists public.clinical_ai_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  domain text not null check (domain in ('orads', 'birads', 'tirads', 'figo', 'obstetrics', 'gynecology', 'ultrasound')),
  memory_type text not null check (memory_type in ('patient_context', 'doctor_pattern', 'case_learning', 'safety_rule', 'preference')),
  title text not null check (char_length(trim(title)) > 0 and char_length(title) <= 160),
  detail text not null check (char_length(trim(detail)) > 0 and char_length(detail) <= 2000),
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  payload jsonb not null default '{}'::jsonb,
  source_event_id uuid references public.ai_orads_events (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists clinical_ai_memory_user_domain_idx
  on public.clinical_ai_memory (user_id, domain, status, created_at desc);

create index if not exists clinical_ai_memory_patient_idx
  on public.clinical_ai_memory (patient_id, domain, status, created_at desc)
  where patient_id is not null;

alter table public.clinical_ai_memory enable row level security;

drop policy if exists clinical_ai_memory_select_own on public.clinical_ai_memory;
create policy clinical_ai_memory_select_own on public.clinical_ai_memory
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists clinical_ai_memory_insert_own on public.clinical_ai_memory;
create policy clinical_ai_memory_insert_own on public.clinical_ai_memory
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists clinical_ai_memory_update_own on public.clinical_ai_memory;
create policy clinical_ai_memory_update_own on public.clinical_ai_memory
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists clinical_ai_memory_delete_own on public.clinical_ai_memory;
create policy clinical_ai_memory_delete_own on public.clinical_ai_memory
  for delete to authenticated
  using (auth.uid() = user_id);

comment on table public.clinical_ai_memory is
  'Visible physician-controlled clinical AI memory items; use archived status for forgetting.';
