-- Structured calculator payloads per authenticated user (JSON for flexible schemas)

create table if not exists public.calculator_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  calculator_code text not null,
  payload jsonb not null default '{}'::jsonb,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists calculator_entries_user_code_idx
  on public.calculator_entries (user_id, calculator_code, created_at desc);

alter table public.calculator_entries enable row level security;

create policy "calculator_entries_select_own" on public.calculator_entries
  for select to authenticated using (auth.uid() = user_id);

create policy "calculator_entries_insert_own" on public.calculator_entries
  for insert to authenticated with check (auth.uid() = user_id);

create policy "calculator_entries_delete_own" on public.calculator_entries
  for delete to authenticated using (auth.uid() = user_id);
