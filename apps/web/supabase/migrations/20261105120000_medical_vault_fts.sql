-- P1-4: Full-text search on medical vault chunks (RU+EN simple).
-- FILE ONLY — do NOT apply to production without explicit GO.
-- Staging: apply after 20261104140000_medical_vault_pgvector.sql.

-- Generated tsvector from sanitized (preferred) or raw content.
alter table public.source_chunks
  add column if not exists content_tsv tsvector;

update public.source_chunks
set content_tsv = to_tsvector(
  'simple',
  coalesce(nullif(trim(sanitized_content), ''), content)
)
where content_tsv is null;

create index if not exists source_chunks_content_tsv_gin_idx
  on public.source_chunks
  using gin (content_tsv);

comment on column public.source_chunks.content_tsv is
  'P1-4 FTS: simple config covers RU/EN keywords without stemming dictionaries.';

create or replace function public.source_chunks_content_tsv_trigger()
returns trigger
language plpgsql
as $$
begin
  new.content_tsv := to_tsvector(
    'simple',
    coalesce(nullif(trim(new.sanitized_content), ''), new.content)
  );
  return new;
end;
$$;

drop trigger if exists trg_source_chunks_content_tsv on public.source_chunks;
create trigger trg_source_chunks_content_tsv
  before insert or update of content, sanitized_content
  on public.source_chunks
  for each row
  execute function public.source_chunks_content_tsv_trigger();

-- Keyword search over published + rag_allowed vault (citation-safe quote).
create or replace function public.match_medical_vault_chunks_fts(
  query_text text,
  match_count int default 8
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
set search_path = public
as $$
declare
  tsq tsquery;
begin
  if query_text is null or length(trim(query_text)) < 2 then
    return;
  end if;
  if match_count is null or match_count < 1 then
    match_count := 1;
  end if;
  if match_count > 24 then
    match_count := 24;
  end if;

  tsq := plainto_tsquery('simple', left(trim(query_text), 200));

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
    least(1.0, ts_rank_cd(c.content_tsv, tsq)::float * 2.0)::float as similarity
  from public.source_chunks c
  inner join public.sources s on s.id = c.source_id
  where c.content_tsv @@ tsq
    and s.review_status = 'published'
    and s.rag_allowed = true
    and c.review_status in ('published', 'reviewed', 'extracted')
  order by ts_rank_cd(c.content_tsv, tsq) desc
  limit match_count;
end;
$$;

revoke all on function public.match_medical_vault_chunks_fts(text, int) from public;
grant execute on function public.match_medical_vault_chunks_fts(text, int) to service_role;

comment on function public.match_medical_vault_chunks_fts(text, int) is
  'P1-4: keyword FTS over published rag_allowed vault; service_role only. Merge with semantic in app.';
