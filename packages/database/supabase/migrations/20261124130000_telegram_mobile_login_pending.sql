-- Mobile Telegram deep-link login (replaces in-memory chat-server pending map).

create table if not exists public.telegram_login_pending (
  nonce uuid primary key,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'consumed')),
  payload jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists telegram_login_pending_expires_at_idx
  on public.telegram_login_pending (expires_at);

comment on table public.telegram_login_pending is
  'Short-lived nonces for mobile Telegram /start login_{nonce}; service role only via web API.';

alter table public.telegram_login_pending enable row level security;

-- No anon/authenticated policies: access only via service role (web API).

create or replace function public.purge_expired_telegram_login_pending()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.telegram_login_pending where expires_at < now();
$$;