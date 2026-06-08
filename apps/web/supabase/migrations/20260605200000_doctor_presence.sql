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
