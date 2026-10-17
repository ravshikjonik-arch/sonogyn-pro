-- Allow authenticated users to insert own audit rows (API logging)

create policy "evidence_query_log_insert_own" on public.evidence_query_log
  for insert to authenticated with check (auth.uid() = user_id);
