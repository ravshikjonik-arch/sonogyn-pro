-- Web Push subscriptions (PWA doctor chat); sending requires VAPID private key on server/worker.

create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists web_push_subscriptions_user_idx
  on public.web_push_subscriptions (user_id, updated_at desc);

alter table public.web_push_subscriptions enable row level security;

drop policy if exists web_push_subscriptions_own on public.web_push_subscriptions;
create policy web_push_subscriptions_own on public.web_push_subscriptions
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.web_push_subscriptions is
  'Browser PushManager subscriptions; Expo mobile uses user_push_tokens separately.';
