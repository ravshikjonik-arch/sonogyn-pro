-- Doctor messenger v2: seq-ordered messages, client_uuid idempotency, cursor history.
-- Coexists with doctor_chat_messages (v1); backfill is idempotent.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.messenger_chats (
  id uuid primary key default gen_random_uuid(),
  chat_type text not null check (chat_type in ('channel', 'dm', 'group', 'consilium')),
  title text not null,
  legacy_doctor_channel_id uuid references public.doctor_chat_channels (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists messenger_chats_legacy_channel_uidx
  on public.messenger_chats (legacy_doctor_channel_id)
  where legacy_doctor_channel_id is not null;

create table if not exists public.messenger_chat_counters (
  chat_id uuid primary key references public.messenger_chats (id) on delete cascade,
  next_seq bigint not null default 1
);

create table if not exists public.messenger_chat_members (
  chat_id uuid not null references public.messenger_chats (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  last_read_seq bigint not null default 0,
  muted_until timestamptz,
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create index if not exists messenger_chat_members_user_idx
  on public.messenger_chat_members (user_id, chat_id);

create table if not exists public.messenger_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.messenger_chats (id) on delete cascade,
  seq bigint not null,
  client_uuid uuid not null,
  sender_id uuid not null references auth.users (id) on delete cascade,
  message_type text not null default 'text' check (message_type in ('text', 'system')),
  body text,
  reply_to_message_id uuid references public.messenger_messages (id) on delete set null,
  edited_at timestamptz,
  deleted_at timestamptz,
  legacy_doctor_message_id uuid,
  created_at timestamptz not null default now(),
  unique (chat_id, seq),
  unique (chat_id, client_uuid)
);

create index if not exists messenger_messages_chat_seq_desc_idx
  on public.messenger_messages (chat_id, seq desc);

create unique index if not exists messenger_messages_legacy_doctor_msg_uidx
  on public.messenger_messages (legacy_doctor_message_id)
  where legacy_doctor_message_id is not null;

create table if not exists public.messenger_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messenger_messages (id) on delete cascade,
  storage_path text not null,
  media_type text not null check (media_type in ('image', 'video', 'file', 'audio')),
  byte_size bigint,
  width int,
  height int,
  preview_storage_path text,
  created_at timestamptz not null default now()
);

create index if not exists messenger_message_attachments_message_idx
  on public.messenger_message_attachments (message_id);

create table if not exists public.messenger_message_receipts (
  message_id uuid not null references public.messenger_messages (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('delivered', 'read')),
  at timestamptz not null default now(),
  primary key (message_id, user_id, status)
);

create index if not exists messenger_message_receipts_user_idx
  on public.messenger_message_receipts (user_id, at desc);

-- Defer body_check until attachments exist: drop and recreate without subquery (PG cannot use mutable subquery in CHECK easily)
alter table public.messenger_messages drop constraint if exists messenger_messages_body_check;

alter table public.messenger_messages add constraint messenger_messages_body_check check (
  deleted_at is not null
  or message_type = 'system'
  or (body is not null and length(trim(body)) > 0)
);

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

create or replace function public.messenger_user_can_access_chat(p_chat_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.messenger_chats c
    where c.id = p_chat_id
      and public.has_doctor_community_access(p_user_id)
      and (
        c.chat_type = 'channel'
        or exists (
          select 1 from public.messenger_chat_members m
          where m.chat_id = c.id and m.user_id = p_user_id
        )
      )
  );
$$;

revoke all on function public.messenger_user_can_access_chat(uuid, uuid) from public;
grant execute on function public.messenger_user_can_access_chat(uuid, uuid) to authenticated;

create or replace function public.messenger_ensure_member(p_chat_id uuid, p_user_id uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or not public.has_doctor_community_access(p_user_id) then
    raise exception 'community access required' using errcode = '42501';
  end if;

  insert into public.messenger_chat_members (chat_id, user_id, role)
  values (p_chat_id, p_user_id, 'member')
  on conflict (chat_id, user_id) do nothing;
end;
$$;

revoke all on function public.messenger_ensure_member(uuid, uuid) from public;
grant execute on function public.messenger_ensure_member(uuid, uuid) to authenticated;

create or replace function public.messenger_ensure_channel_chat(p_legacy_channel_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_title text;
begin
  select id into v_id from public.messenger_chats where legacy_doctor_channel_id = p_legacy_channel_id;
  if v_id is not null then
    return v_id;
  end if;

  select title into v_title from public.doctor_chat_channels where id = p_legacy_channel_id;
  if v_title is null then
    raise exception 'unknown doctor channel' using errcode = '22023';
  end if;

  insert into public.messenger_chats (chat_type, title, legacy_doctor_channel_id)
  values ('channel', v_title, p_legacy_channel_id)
  returning id into v_id;

  insert into public.messenger_chat_counters (chat_id, next_seq) values (v_id, 1)
  on conflict (chat_id) do nothing;

  return v_id;
end;
$$;

revoke all on function public.messenger_ensure_channel_chat(uuid) from public;
grant execute on function public.messenger_ensure_channel_chat(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Send (idempotent on client_uuid)
-- ---------------------------------------------------------------------------

create or replace function public.messenger_send_message(
  p_chat_id uuid,
  p_client_uuid uuid,
  p_body text default null,
  p_reply_to_message_id uuid default null,
  p_attachment_storage_path text default null,
  p_attachment_media_type text default null
)
returns public.messenger_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.messenger_messages;
  v_seq bigint;
  v_row public.messenger_messages;
  v_body text;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  if not public.messenger_user_can_access_chat(p_chat_id, v_uid) then
    raise exception 'chat access denied' using errcode = '42501';
  end if;

  perform public.messenger_ensure_member(p_chat_id, v_uid);

  select * into v_existing
  from public.messenger_messages m
  where m.chat_id = p_chat_id and m.client_uuid = p_client_uuid;

  if found then
    if v_existing.sender_id <> v_uid then
      raise exception 'client_uuid conflict' using errcode = '23505';
    end if;
    return v_existing;
  end if;

  v_body := nullif(trim(coalesce(p_body, '')), '');

  if v_body is null and p_attachment_storage_path is null then
    raise exception 'empty message' using errcode = '22023';
  end if;

  if p_reply_to_message_id is not null then
    if not exists (
      select 1 from public.messenger_messages r
      where r.id = p_reply_to_message_id and r.chat_id = p_chat_id and r.deleted_at is null
    ) then
      raise exception 'invalid reply target' using errcode = '22023';
    end if;
  end if;

  insert into public.messenger_chat_counters (chat_id, next_seq)
  values (p_chat_id, 1)
  on conflict (chat_id) do nothing;

  update public.messenger_chat_counters
  set next_seq = next_seq + 1
  where chat_id = p_chat_id
  returning next_seq - 1 into v_seq;

  insert into public.messenger_messages (
    chat_id, seq, client_uuid, sender_id, message_type, body, reply_to_message_id
  )
  values (
    p_chat_id, v_seq, p_client_uuid, v_uid, 'text', v_body, p_reply_to_message_id
  )
  returning * into v_row;

  if p_attachment_storage_path is not null then
    if p_attachment_media_type is null or p_attachment_media_type not in ('image', 'video', 'file', 'audio') then
      raise exception 'invalid attachment media_type' using errcode = '22023';
    end if;
    insert into public.messenger_message_attachments (message_id, storage_path, media_type)
    values (v_row.id, p_attachment_storage_path, p_attachment_media_type);
  end if;

  insert into public.messenger_message_receipts (message_id, user_id, status)
  values (v_row.id, v_uid, 'delivered')
  on conflict do nothing;

  update public.messenger_chats set updated_at = now() where id = p_chat_id;

  return v_row;
end;
$$;

revoke all on function public.messenger_send_message(uuid, uuid, text, uuid, text, text) from public;
grant execute on function public.messenger_send_message(uuid, uuid, text, uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill v1 channel messages (idempotent)
-- ---------------------------------------------------------------------------

create or replace function public.messenger_backfill_doctor_channels()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channels int := 0;
  v_messages int := 0;
  v_inserted int;
  v_chat_id uuid;
  v_next_seq bigint;
  ch record;
begin
  if to_regclass('public.doctor_chat_channels') is null then
    return jsonb_build_object('skipped', true, 'reason', 'no doctor_chat_channels');
  end if;

  for ch in select id, title from public.doctor_chat_channels order by sort_order
  loop
    select c.id into v_chat_id
    from public.messenger_chats c
    where c.legacy_doctor_channel_id = ch.id;

    if v_chat_id is null then
      insert into public.messenger_chats (chat_type, title, legacy_doctor_channel_id)
      values ('channel', ch.title, ch.id)
      returning id into v_chat_id;
    else
      update public.messenger_chats
      set title = ch.title, updated_at = now()
      where id = v_chat_id;
    end if;

    insert into public.messenger_chat_counters (chat_id, next_seq) values (v_chat_id, 1)
    on conflict (chat_id) do nothing;

    v_channels := v_channels + 1;

    with ordered as (
      select
        m.*,
        (row_number() over (order by m.created_at asc, m.id asc) - 1)::bigint as seq_no
      from public.doctor_chat_messages m
      where m.channel_id = ch.id
    )
    insert into public.messenger_messages (
      chat_id,
      seq,
      client_uuid,
      sender_id,
      message_type,
      body,
      legacy_doctor_message_id,
      created_at
    )
    select
      v_chat_id,
      o.seq_no,
      o.id,
      o.author_id,
      'text',
      coalesce(nullif(trim(o.body), ''), case when o.media_storage_path is not null then '[вложение]' else null end),
      o.id,
      o.created_at
    from ordered o
    where not exists (
      select 1 from public.messenger_messages mm where mm.legacy_doctor_message_id = o.id
    );

    get diagnostics v_inserted = row_count;
    v_messages := v_messages + v_inserted;

    insert into public.messenger_message_attachments (message_id, storage_path, media_type)
    select msg.id, o.media_storage_path, o.media_type
    from public.doctor_chat_messages o
    join public.messenger_messages msg on msg.legacy_doctor_message_id = o.id
    where o.channel_id = ch.id
      and o.media_storage_path is not null
      and o.media_type is not null
      and not exists (
        select 1 from public.messenger_message_attachments a
        where a.message_id = msg.id and a.storage_path = o.media_storage_path
      );

    select coalesce(max(m.seq), -1) + 1 into v_next_seq
    from public.messenger_messages m
    where m.chat_id = v_chat_id;

    update public.messenger_chat_counters
    set next_seq = greatest(next_seq, v_next_seq)
    where chat_id = v_chat_id;
  end loop;

  return jsonb_build_object('channels', v_channels, 'messages_inserted', v_messages);
end;
$$;

revoke all on function public.messenger_backfill_doctor_channels() from public;
grant execute on function public.messenger_backfill_doctor_channels() to service_role;

-- Run backfill once at migration time (safe to re-run via ON CONFLICT)
select public.messenger_backfill_doctor_channels();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.messenger_chats enable row level security;
alter table public.messenger_chat_counters enable row level security;
alter table public.messenger_chat_members enable row level security;
alter table public.messenger_messages enable row level security;
alter table public.messenger_message_attachments enable row level security;
alter table public.messenger_message_receipts enable row level security;

drop policy if exists messenger_chats_select on public.messenger_chats;
create policy messenger_chats_select on public.messenger_chats
  for select to authenticated
  using (
    public.has_doctor_community_access()
    and (
      chat_type = 'channel'
      or exists (
        select 1 from public.messenger_chat_members m
        where m.chat_id = id and m.user_id = auth.uid()
      )
    )
  );

drop policy if exists messenger_chat_members_select on public.messenger_chat_members;
create policy messenger_chat_members_select on public.messenger_chat_members
  for select to authenticated
  using (
    public.has_doctor_community_access()
    and (
      user_id = auth.uid()
      or public.messenger_user_can_access_chat(chat_id, auth.uid())
    )
  );

drop policy if exists messenger_chat_members_upsert_self on public.messenger_chat_members;
create policy messenger_chat_members_upsert_self on public.messenger_chat_members
  for insert to authenticated
  with check (user_id = auth.uid() and public.has_doctor_community_access());

drop policy if exists messenger_chat_members_update_self on public.messenger_chat_members;
create policy messenger_chat_members_update_self on public.messenger_chat_members
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists messenger_messages_select on public.messenger_messages;
create policy messenger_messages_select on public.messenger_messages
  for select to authenticated
  using (public.messenger_user_can_access_chat(chat_id, auth.uid()));

drop policy if exists messenger_attachments_select on public.messenger_message_attachments;
create policy messenger_attachments_select on public.messenger_message_attachments
  for select to authenticated
  using (
    exists (
      select 1 from public.messenger_messages msg
      where msg.id = message_id
        and public.messenger_user_can_access_chat(msg.chat_id, auth.uid())
    )
  );

drop policy if exists messenger_receipts_select on public.messenger_message_receipts;
create policy messenger_receipts_select on public.messenger_message_receipts
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.messenger_messages msg
      where msg.id = message_id and msg.sender_id = auth.uid()
    )
  );

-- Counters: no direct client access (seq via RPC only)
drop policy if exists messenger_counters_deny on public.messenger_chat_counters;
create policy messenger_counters_deny on public.messenger_chat_counters
  for select to authenticated
  using (false);

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messenger_messages'
    ) then
      alter publication supabase_realtime add table public.messenger_messages;
    end if;
  end if;
end $$;

comment on table public.messenger_chats is 'Doctor messenger v2 rooms (channel/dm/group/consilium).';
comment on table public.messenger_messages is 'Seq-ordered messages; client_uuid for idempotent send.';

-- Storage: allow read for v2 attachment paths linked to messages.
drop policy if exists doctor_chat_media_select on storage.objects;
create policy doctor_chat_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'doctor-chat-media'
    and public.has_doctor_community_access()
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.doctor_chat_messages m
        where m.media_storage_path = name
      )
      or exists (
        select 1 from public.teaching_case_comments c
        where c.media_storage_path = name
      )
      or exists (
        select 1 from public.messenger_message_attachments a
        where a.storage_path = name
      )
    )
  );
