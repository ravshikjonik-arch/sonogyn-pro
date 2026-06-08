-- SonoGyn Pro · все миграции (порядок по имени файла)
-- Supabase Dashboard → SQL Editor → вставить и Run
-- Сгенерировано: 2026-06-07T21:29:57.836Z

-- ========== 20260605120000_teaching_case_media_storage.sql ==========
-- Storage for teaching case ultrasound images/videos (anonymized, no PHI in production policy).

insert into storage.buckets (id, name, public)
values ('teaching-case-media', 'teaching-case-media', false)
on conflict (id) do nothing;

drop policy if exists teaching_case_media_select on storage.objects;
create policy teaching_case_media_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'teaching-case-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.cases c
        where c.id::text = (storage.foldername(name))[2]
          and c.status = 'published'
          and c.is_public = true
      )
    )
  );

drop policy if exists teaching_case_media_insert on storage.objects;
create policy teaching_case_media_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'teaching-case-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (
      select 1 from public.cases c
      where c.id::text = (storage.foldername(name))[2]
        and c.user_id = auth.uid()
    )
  );

drop policy if exists teaching_case_media_delete on storage.objects;
create policy teaching_case_media_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'teaching-case-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

comment on table public.case_media is 'Media attachments for teaching cases — paths in bucket teaching-case-media.';

-- ========== 20260605130000_doctor_chat.sql ==========
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

-- ========== 20260605140000_community_realtime.sql ==========
-- Realtime для чата врачей и ленты кейсов (idempotent).

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cases'
  ) then
    alter publication supabase_realtime add table public.cases;
  end if;
end $migration$;

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'teaching_case_comments'
  ) then
    alter publication supabase_realtime add table public.teaching_case_comments;
  end if;
end $migration$;

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'doctor_chat_messages'
  ) then
    alter publication supabase_realtime add table public.doctor_chat_messages;
  end if;
end $migration$;

-- ========== 20260605200000_doctor_presence.sql ==========
-- Online / offline roster for doctors community chat.

create table if not exists public.doctor_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Врач',
  status text not null default 'offline' check (status in ('online', 'offline')),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists doctor_presence_status_idx
  on public.doctor_presence (status, last_seen_at desc);

alter table public.doctor_presence enable row level security;

drop policy if exists doctor_presence_select on public.doctor_presence;
create policy doctor_presence_select on public.doctor_presence
  for select to authenticated
  using (true);

drop policy if exists doctor_presence_upsert_self on public.doctor_presence;
create policy doctor_presence_upsert_self on public.doctor_presence
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Roster names: authenticated users may read peers' id + full_name for presence UI.
drop policy if exists profiles_select_roster on public.profiles;
create policy profiles_select_roster on public.profiles
  for select to authenticated
  using (true);

comment on table public.doctor_presence is 'Heartbeat-based online/offline for doctors community.';

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'doctor_presence'
  ) then
    alter publication supabase_realtime add table public.doctor_presence;
  end if;
end $migration$;
