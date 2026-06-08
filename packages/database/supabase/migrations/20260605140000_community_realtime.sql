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
