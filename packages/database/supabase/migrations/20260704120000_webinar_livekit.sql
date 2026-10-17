-- Webinars: LiveKit sessions + in-room chat (paid enrollment required)

alter table public.course_lessons
  drop constraint if exists course_lessons_lesson_type_check;

alter table public.course_lessons
  add constraint course_lessons_lesson_type_check
  check (lesson_type in ('video', 'offline', 'webinar'));

create table if not exists public.webinar_sessions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.course_lessons (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  room_name text not null unique,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'ended', 'cancelled')),
  scheduled_at timestamptz not null,
  started_at timestamptz,
  ended_at timestamptz,
  livekit_room_sid text,
  recording_storage_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webinar_sessions_course on public.webinar_sessions (course_id);
create index if not exists idx_webinar_sessions_status_scheduled
  on public.webinar_sessions (status, scheduled_at desc);

create table if not exists public.webinar_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.webinar_sessions (id) on delete cascade,
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_display_name text,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 2000),
  is_pinned boolean not null default false,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_webinar_chat_session_created
  on public.webinar_chat_messages (session_id, created_at asc);

create or replace function public.can_access_webinar(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_lessons cl
    join public.courses c on c.id = cl.course_id
    where cl.id = p_lesson_id
      and cl.lesson_type = 'webinar'
      and (
        public.can_manage_course(cl.course_id)
        or (
          c.status = 'published'
          and c.price_rub > 0
          and exists (
            select 1
            from public.course_enrollments e
            where e.course_id = cl.course_id
              and e.user_id = auth.uid()
          )
        )
      )
  );
$$;

create or replace function public.can_host_webinar(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.course_lessons cl
    where cl.id = p_lesson_id
      and cl.lesson_type = 'webinar'
      and public.can_manage_course(cl.course_id)
  );
$$;

alter table public.webinar_sessions enable row level security;
alter table public.webinar_chat_messages enable row level security;

drop policy if exists webinar_sessions_select on public.webinar_sessions;
create policy webinar_sessions_select on public.webinar_sessions
  for select to authenticated
  using (
    public.can_access_webinar(lesson_id)
    or exists (
      select 1
      from public.course_lessons cl
      join public.courses c on c.id = cl.course_id
      where cl.id = lesson_id
        and c.status = 'published'
    )
  );

drop policy if exists webinar_sessions_select_public on public.webinar_sessions;
create policy webinar_sessions_select_public on public.webinar_sessions
  for select
  using (
    exists (
      select 1
      from public.course_lessons cl
      join public.courses c on c.id = cl.course_id
      where cl.id = lesson_id
        and cl.lesson_type = 'webinar'
        and c.status = 'published'
    )
  );

drop policy if exists webinar_sessions_manage on public.webinar_sessions;
create policy webinar_sessions_manage on public.webinar_sessions
  for all to authenticated
  using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists webinar_chat_select on public.webinar_chat_messages;
create policy webinar_chat_select on public.webinar_chat_messages
  for select to authenticated
  using (public.can_access_webinar(lesson_id) and is_hidden = false);

drop policy if exists webinar_chat_insert on public.webinar_chat_messages;
create policy webinar_chat_insert on public.webinar_chat_messages
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.can_access_webinar(lesson_id)
  );

drop policy if exists webinar_chat_moderate on public.webinar_chat_messages;
create policy webinar_chat_moderate on public.webinar_chat_messages
  for update to authenticated
  using (public.can_host_webinar(lesson_id))
  with check (public.can_host_webinar(lesson_id));

do $migration$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'webinar_chat_messages'
  ) then
    alter publication supabase_realtime add table public.webinar_chat_messages;
  end if;
end $migration$;
