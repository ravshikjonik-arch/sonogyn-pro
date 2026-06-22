-- O-RADS assist analytics: text → extracted features → AI category vs manual (Sprint 2)

create table if not exists public.ai_orads_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  study_id uuid references public.studies (id) on delete set null,
  platform text not null check (platform in ('web', 'mobile')),
  source_text text not null,
  extracted jsonb not null default '{}'::jsonb,
  hints jsonb not null default '[]'::jsonb,
  unresolved_nodes jsonb not null default '[]'::jsonb,
  ai_category_number smallint check (ai_category_number between 0 and 5),
  ai_complete_path jsonb,
  age_years smallint check (age_years between 0 and 130),
  age_source text check (age_source in ('text', 'profile')),
  menopause text check (menopause in ('pre', 'post')),
  menopause_source text check (menopause_source in ('text', 'ui', 'profile')),
  protocol_draft text,
  protocol_draft_source text check (protocol_draft_source in ('local', 'protocol-ai', 'none')),
  manual_category_number smallint check (manual_category_number between 1 and 5),
  feedback_correct boolean,
  feedback_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  feedback_at timestamptz
);

create index if not exists ai_orads_events_user_created_idx
  on public.ai_orads_events (user_id, created_at desc);

create index if not exists ai_orads_events_patient_idx
  on public.ai_orads_events (patient_id, created_at desc)
  where patient_id is not null;

alter table public.ai_orads_events enable row level security;

create policy "ai_orads_events_select_own" on public.ai_orads_events
  for select to authenticated using (auth.uid() = user_id);

create policy "ai_orads_events_insert_own" on public.ai_orads_events
  for insert to authenticated with check (auth.uid() = user_id);

create policy "ai_orads_events_update_own" on public.ai_orads_events
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
