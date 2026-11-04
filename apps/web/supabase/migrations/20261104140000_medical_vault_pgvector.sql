-- Medical vault hybrid RAG: HNSW on source_chunks.embedding + match RPC.
-- ADR-VEC: pgvector first (no Qdrant). Apply on staging before prod.

-- Partial HNSW: only rows that already have embeddings (cheap when column mostly null).
create index if not exists source_chunks_embedding_hnsw_idx
  on public.source_chunks
  using hnsw (embedding extensions.vector_cosine_ops)
  with (m = 16, ef_construction = 64)
  where embedding is not null;

comment on index public.source_chunks_embedding_hnsw_idx is
  'ADR-VEC Wave K2: cosine HNSW for medical vault RAG chunks.';

-- Returns citation-safe snippets for published + rag_allowed sources only.
-- Never returns full book text beyond quote length; service_role only.
create or replace function public.match_medical_vault_chunks(
  query_embedding extensions.vector(1536),
  match_count int default 8,
  match_threshold float default 0.72
)
returns table (
  chunk_id uuid,
  source_id uuid,
  title text,
  organization text,
  year int,
  section_title text,
  quote text,
  external_url text,
  similarity float
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if match_count is null or match_count < 1 then
    match_count := 1;
  end if;
  if match_count > 24 then
    match_count := 24;
  end if;
  if match_threshold is null then
    match_threshold := 0.72;
  end if;

  return query
  select
    c.id as chunk_id,
    s.id as source_id,
    s.title,
    s.organization,
    s.year,
    c.section_title,
    left(coalesce(nullif(trim(c.sanitized_content), ''), c.content), 480) as quote,
    s.external_url,
    (1 - (c.embedding <=> query_embedding))::float as similarity
  from public.source_chunks c
  inner join public.sources s on s.id = c.source_id
  where c.embedding is not null
    and s.review_status = 'published'
    and s.rag_allowed = true
    and c.review_status in ('published', 'reviewed', 'extracted')
    and (1 - (c.embedding <=> query_embedding)) >= match_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
end;
$$;

revoke all on function public.match_medical_vault_chunks(extensions.vector, int, float) from public;
grant execute on function public.match_medical_vault_chunks(extensions.vector, int, float) to service_role;

comment on function public.match_medical_vault_chunks(extensions.vector, int, float) is
  'ADR-VEC: semantic search over published rag_allowed vault chunks; service_role only.';
