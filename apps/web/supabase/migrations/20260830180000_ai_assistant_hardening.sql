-- AI assistant hardening: chat sessions, message history, feedback, event metadata

create table if not exists public.ai_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Новый чат',
  domain text not null default 'general',
  prompt_version text,
  model_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_chat_sessions_user_updated_idx
  on public.ai_chat_sessions (user_id, updated_at desc);

create table if not exists public.ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.ai_chat_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  tool_results jsonb,
  evidence jsonb,
  is_ai_draft boolean not null default false,
  model_id text,
  prompt_version text,
  created_at timestamptz not null default now()
);

create index if not exists ai_chat_messages_session_created_idx
  on public.ai_chat_messages (session_id, created_at asc);

create table if not exists public.ai_chat_message_feedback (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.ai_chat_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (message_id, user_id)
);

alter table public.ai_chat_events
  add column if not exists prompt_version text,
  add column if not exists estimated_cost_usd numeric(10, 6),
  add column if not exists session_id uuid references public.ai_chat_sessions (id) on delete set null;

alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;
alter table public.ai_chat_message_feedback enable row level security;

create policy "ai_chat_sessions_select_own" on public.ai_chat_sessions
  for select to authenticated using (auth.uid() = user_id);

create policy "ai_chat_sessions_insert_own" on public.ai_chat_sessions
  for insert to authenticated with check (auth.uid() = user_id);

create policy "ai_chat_sessions_update_own" on public.ai_chat_sessions
  for update to authenticated using (auth.uid() = user_id);

create policy "ai_chat_sessions_delete_own" on public.ai_chat_sessions
  for delete to authenticated using (auth.uid() = user_id);

create policy "ai_chat_messages_select_own" on public.ai_chat_messages
  for select to authenticated using (auth.uid() = user_id);

create policy "ai_chat_messages_insert_own" on public.ai_chat_messages
  for insert to authenticated with check (auth.uid() = user_id);

create policy "ai_chat_message_feedback_select_own" on public.ai_chat_message_feedback
  for select to authenticated using (auth.uid() = user_id);

create policy "ai_chat_message_feedback_insert_own" on public.ai_chat_message_feedback
  for insert to authenticated with check (auth.uid() = user_id);

create policy "ai_chat_message_feedback_update_own" on public.ai_chat_message_feedback
  for update to authenticated using (auth.uid() = user_id);
