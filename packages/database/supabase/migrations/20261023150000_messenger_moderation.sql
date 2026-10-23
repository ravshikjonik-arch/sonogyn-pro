-- Messenger v2: moderation reports (community chat).

create table if not exists public.messenger_message_reports (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.messenger_chats (id) on delete cascade,
  message_id uuid not null references public.messenger_messages (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

create index if not exists messenger_message_reports_chat_idx
  on public.messenger_message_reports (chat_id, created_at desc);

create index if not exists messenger_message_reports_status_idx
  on public.messenger_message_reports (status, created_at desc)
  where status = 'open';

alter table public.messenger_message_reports enable row level security;

drop policy if exists messenger_reports_insert on public.messenger_message_reports;
create policy messenger_reports_insert on public.messenger_message_reports
  for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and public.messenger_user_can_access_chat(chat_id, auth.uid())
    and exists (
      select 1 from public.messenger_messages m
      where m.id = message_id and m.chat_id = chat_id and m.deleted_at is null
    )
  );

drop policy if exists messenger_reports_select on public.messenger_message_reports;
create policy messenger_reports_select on public.messenger_message_reports
  for select to authenticated
  using (
    reporter_id = auth.uid()
    or public.is_moderator()
    or public.is_admin()
  );

drop policy if exists messenger_reports_update on public.messenger_message_reports;
create policy messenger_reports_update on public.messenger_message_reports
  for update to authenticated
  using (public.is_moderator() or public.is_admin())
  with check (public.is_moderator() or public.is_admin());

comment on table public.messenger_message_reports is
  'Doctor messenger v2 moderation queue; one report per user per message.';
