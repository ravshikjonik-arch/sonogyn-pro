-- Doctors community chat: topic channels + messages with optional media.
-- Case thread comments: optional media per message.

create table if not exists public.doctor_chat_channels (
  id uuid primary key,
  slug text not null unique,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into public.doctor_chat_channels (id, slug, title, description, sort_order)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'general',
    'Общий чат',
    'Вопросы, мысли, обмен опытом — без PHI.',
    0
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'gynecology',
    'Гинекология · УЗИ',
    'Яичники, матка, O-RADS, эндометриоз, МЖ.',
    1
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'obstetrics',
    'Акушерство · УЗИ',
    'Беременность, скрининги, FMF, допплер.',
    2
  )
on conflict (id) do nothing;

create table if not exists public.doctor_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.doctor_chat_channels (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  body text,
  media_storage_path text,
  media_type text check (media_type is null or media_type in ('image', 'video')),
  created_at timestamptz not null default now(),
  constraint doctor_chat_messages_content check (
    (body is not null and length(trim(body)) > 0)
    or media_storage_path is not null
  )
);

create index if not exists doctor_chat_messages_channel_idx
  on public.doctor_chat_messages (channel_id, created_at desc);

alter table public.doctor_chat_channels enable row level security;
alter table public.doctor_chat_messages enable row level security;

drop policy if exists doctor_chat_channels_select on public.doctor_chat_channels;
create policy doctor_chat_channels_select on public.doctor_chat_channels
  for select to authenticated
  using (true);

drop policy if exists doctor_chat_messages_select on public.doctor_chat_messages;
create policy doctor_chat_messages_select on public.doctor_chat_messages
  for select to authenticated
  using (true);

drop policy if exists doctor_chat_messages_insert on public.doctor_chat_messages;
create policy doctor_chat_messages_insert on public.doctor_chat_messages
  for insert to authenticated
  with check (author_id = auth.uid());

-- Media in case discussion threads
alter table public.teaching_case_comments
  add column if not exists media_storage_path text,
  add column if not exists media_type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'teaching_case_comments_media_type_check'
  ) then
    alter table public.teaching_case_comments
      add constraint teaching_case_comments_media_type_check
      check (media_type is null or media_type in ('image', 'video'));
  end if;
end $$;

-- Bucket for chat attachments (general + inline case messages)
insert into storage.buckets (id, name, public)
values ('doctor-chat-media', 'doctor-chat-media', false)
on conflict (id) do nothing;

drop policy if exists doctor_chat_media_select on storage.objects;
create policy doctor_chat_media_select on storage.objects
  for select to authenticated
  using (bucket_id = 'doctor-chat-media');

drop policy if exists doctor_chat_media_insert on storage.objects;
create policy doctor_chat_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'doctor-chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists doctor_chat_media_delete on storage.objects;
create policy doctor_chat_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'doctor-chat-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on table public.doctor_chat_channels is 'Topic channels for doctors community chat.';
comment on table public.doctor_chat_messages is 'Messages in doctor chat channels; optional ultrasound image/video.';
