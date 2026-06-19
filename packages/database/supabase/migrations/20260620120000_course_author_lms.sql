-- LMS: courses, modules, lessons, enrollments, sales, author role

-- Роль author для создателей курсов
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'moderator', 'admin', 'author'));

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  description_html text not null default '',
  cover_storage_path text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  price_rub integer not null default 0 check (price_rub >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courses_author_id on public.courses (author_id);
create index if not exists idx_courses_status on public.courses (status);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_modules_course_sort on public.course_modules (course_id, sort_order);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  module_id uuid not null references public.course_modules (id) on delete cascade,
  title text not null default '',
  body_html text not null default '',
  lesson_type text not null default 'video' check (lesson_type in ('video', 'offline')),
  video_url text,
  video_storage_path text,
  offline_starts_at timestamptz,
  offline_address text,
  offline_stream_url text,
  max_seats integer check (max_seats is null or max_seats > 0),
  is_free_preview boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_course_lessons_module_sort on public.course_lessons (module_id, sort_order);
create index if not exists idx_course_lessons_course on public.course_lessons (course_id);
create index if not exists idx_course_lessons_offline on public.course_lessons (offline_starts_at)
  where lesson_type = 'offline';

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  progress_percent smallint not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
  enrolled_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create index if not exists idx_course_enrollments_course on public.course_enrollments (course_id);
create index if not exists idx_course_enrollments_user on public.course_enrollments (user_id);

create table if not exists public.offline_lesson_registrations (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  registered_at timestamptz not null default now(),
  status text not null default 'registered' check (status in ('registered', 'cancelled', 'attended')),
  unique (lesson_id, user_id)
);

create index if not exists idx_offline_regs_lesson on public.offline_lesson_registrations (lesson_id, registered_at desc);
create index if not exists idx_offline_regs_course on public.offline_lesson_registrations (course_id);

create table if not exists public.course_sales (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  buyer_id uuid references auth.users (id) on delete set null,
  amount_rub integer not null check (amount_rub >= 0),
  sold_at timestamptz not null default now(),
  payment_ref text
);

create index if not exists idx_course_sales_author_sold on public.course_sales (author_id, sold_at desc);
create index if not exists idx_course_sales_course on public.course_sales (course_id);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_author_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('author', 'admin')
  );
$$;

create or replace function public.is_course_owner(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and c.author_id = auth.uid()
  );
$$;

create or replace function public.can_manage_course(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_course_owner(p_course_id)
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.offline_lesson_registrations enable row level security;
alter table public.course_sales enable row level security;

-- courses
drop policy if exists courses_select_published on public.courses;
create policy courses_select_published on public.courses
  for select using (
    status = 'published'
    or author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists courses_author_write on public.courses;
create policy courses_author_write on public.courses
  for all using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists courses_admin_all on public.courses;
create policy courses_admin_all on public.courses
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- modules
drop policy if exists course_modules_manage on public.course_modules;
create policy course_modules_manage on public.course_modules
  for all using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists course_modules_select_enrolled on public.course_modules;
create policy course_modules_select_enrolled on public.course_modules
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (c.status = 'published' or c.author_id = auth.uid())
    )
  );

-- lessons
drop policy if exists course_lessons_manage on public.course_lessons;
create policy course_lessons_manage on public.course_lessons
  for all using (public.can_manage_course(course_id))
  with check (public.can_manage_course(course_id));

drop policy if exists course_lessons_select on public.course_lessons;
create policy course_lessons_select on public.course_lessons
  for select using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (c.status = 'published' or c.author_id = auth.uid())
    )
  );

-- enrollments
drop policy if exists course_enrollments_select on public.course_enrollments;
create policy course_enrollments_select on public.course_enrollments
  for select using (
    user_id = auth.uid()
    or public.can_manage_course(course_id)
  );

drop policy if exists course_enrollments_insert on public.course_enrollments;
create policy course_enrollments_insert on public.course_enrollments
  for insert with check (user_id = auth.uid());

drop policy if exists course_enrollments_update on public.course_enrollments;
create policy course_enrollments_update on public.course_enrollments
  for update using (user_id = auth.uid() or public.can_manage_course(course_id));

-- offline registrations
drop policy if exists offline_regs_select on public.offline_lesson_registrations;
create policy offline_regs_select on public.offline_lesson_registrations
  for select using (
    user_id = auth.uid()
    or public.can_manage_course(course_id)
  );

drop policy if exists offline_regs_insert on public.offline_lesson_registrations;
create policy offline_regs_insert on public.offline_lesson_registrations
  for insert with check (user_id = auth.uid());

-- sales
drop policy if exists course_sales_author on public.course_sales;
create policy course_sales_author on public.course_sales
  for select using (
    author_id = auth.uid()
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists course_sales_insert_service on public.course_sales;
create policy course_sales_insert_service on public.course_sales
  for insert with check (author_id = auth.uid() or public.is_author_or_admin());

-- ---------------------------------------------------------------------------
-- Storage bucket course-media
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'course-media',
  'course-media',
  false,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']::text[]
)
on conflict (id) do nothing;

drop policy if exists course_media_owner_rw on storage.objects;
create policy course_media_owner_rw on storage.objects
  for all using (
    bucket_id = 'course-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'course-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists course_media_admin on storage.objects;
create policy course_media_admin on storage.objects
  for all using (
    bucket_id = 'course-media'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
