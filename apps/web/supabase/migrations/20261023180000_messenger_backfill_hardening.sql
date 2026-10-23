-- Fix channel upsert for partial unique index; re-run v1 → v2 backfill (idempotent).

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

select public.messenger_backfill_doctor_channels();
