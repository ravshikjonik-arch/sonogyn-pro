-- Stage 3: performance indexes + regulation claim helper
-- Apply on staging first. Do NOT run via agent MCP without explicit user OK.

-- AI quota / gateway (user_id + success + created_at)
create index if not exists ai_chat_events_user_success_created_idx
  on public.ai_chat_events (user_id, success, created_at desc);

create index if not exists ai_chat_events_session_id_idx
  on public.ai_chat_events (session_id)
  where session_id is not null;

-- Evidence / RAG ops
create index if not exists evidence_query_log_created_idx
  on public.evidence_query_log (created_at desc);

create index if not exists rag_query_logs_user_created_idx
  on public.rag_query_logs (user_id, created_at desc)
  where user_id is not null;

-- External guidelines loader (.in source + order published_at)
create index if not exists guidelines_external_index_source_published_idx
  on public.guidelines_external_index (source, published_at desc nulls last);

-- Patients list: created_by + updated_at cursor
create index if not exists patients_created_by_updated_idx
  on public.patients (created_by, updated_at desc, id desc);

-- Analytics (if used)
create index if not exists analytics_events_name_created_idx
  on public.analytics_events (event_name, created_at desc);

-- Messenger inbox activity
create index if not exists messenger_chats_updated_idx
  on public.messenger_chats (updated_at desc);

-- Claim next regulation row for worker (SKIP LOCKED)
create or replace function public.claim_regulation_ingest_jobs(p_limit int default 5)
returns setof public.regulation_ingest_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_limit is null or p_limit < 1 then
    p_limit := 1;
  end if;
  if p_limit > 20 then
    p_limit := 20;
  end if;

  return query
  with cte as (
    select q.id
    from public.regulation_ingest_queue q
    where q.status in ('discovered', 'pending_extraction')
    order by q.fetched_at asc
    for update skip locked
    limit p_limit
  )
  update public.regulation_ingest_queue q
  set
    status = 'pending_extraction',
    updated_at = now()
  from cte
  where q.id = cte.id
  returning q.*;
end;
$$;

revoke all on function public.claim_regulation_ingest_jobs(int) from public;
grant execute on function public.claim_regulation_ingest_jobs(int) to service_role;

comment on function public.claim_regulation_ingest_jobs(int) is
  'Stage 3 worker: claim regulation ingest rows with FOR UPDATE SKIP LOCKED.';
