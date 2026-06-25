-- Sonogyn AI chat — аудит метаданных (без PHI / base64)

create table if not exists public.ai_chat_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  domain text not null default 'general',
  success boolean not null default false,
  duration_ms integer not null default 0,
  model text not null default '',
  error_code text,
  prompt_tokens integer,
  completion_tokens integer,
  has_images boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_events_user_created_idx
  on public.ai_chat_events (user_id, created_at desc);

alter table public.ai_chat_events enable row level security;

create policy "ai_chat_events_select_own" on public.ai_chat_events
  for select to authenticated using (auth.uid() = user_id);

-- insert только через service role (API route)
