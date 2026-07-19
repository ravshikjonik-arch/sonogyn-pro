-- Per-subscriber cooldown for live chat push (anti-spam).

alter table public.channel_subscriptions
  add column if not exists last_chat_push_at timestamptz;

comment on column public.channel_subscriptions.last_chat_push_at is
  'Last Expo push for a live chat message in this channel; used for 5-minute cooldown.';
