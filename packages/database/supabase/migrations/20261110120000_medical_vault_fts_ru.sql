-- P1-4b: Russian-morphology FTS on medical vault chunks (supersedes simple-config search for app use).
-- Additive: does not touch content_tsv / match_medical_vault_chunks_fts from 20261105120000.
-- Staging-verified only; production apply requires explicit GO.
-- Rollback:
--   drop function if exists public.match_medical_vault_chunks_fts_ru(text, int);
--   drop function if exists public.medical_vault_ru_tsquery(text);
--   drop index if exists public.source_chunks_content_tsv_ru_gin_idx;
--   alter table public.source_chunks drop column if exists content_tsv_ru;

-- 'russian' config: russian_stem for Cyrillic words, english_stem for ASCII words.
alter table public.source_chunks
  add column if not exists content_tsv_ru tsvector
  generated always as (
    to_tsvector('russian', coalesce(nullif(trim(sanitized_content), ''), content))
  ) stored;

create index if not exists source_chunks_content_tsv_ru_gin_idx
  on public.source_chunks
  using gin (content_tsv_ru);

comment on column public.source_chunks.content_tsv_ru is
  'P1-4b FTS: russian config (stemming RU + EN). AND semantics only: OR merges homonym stems (железа/железы).';

-- Per word: (russian stem | exact lowercase form); words are AND-ed.
-- Exact form covers stemmer asymmetry on drug names («тамоксифен» → 'тамоксиф', «тамоксифеном» → 'тамоксифен').
-- Stopwords (empty russian stem) are skipped. Never OR across words.
create or replace function public.medical_vault_ru_tsquery(query_text text)
returns tsquery
language plpgsql
immutable
set search_path = public
as $$
declare
  word text;
  stem tsquery;
  word_q tsquery;
  result tsquery;
  n int := 0;
begin
  for word in
    select w from regexp_split_to_table(lower(left(coalesce(query_text, ''), 200)), '[^[:alnum:]]+') as w
    where length(w) > 0
  loop
    stem := plainto_tsquery('russian', word);
    continue when stem is null or numnode(stem) = 0;
    word_q := stem || plainto_tsquery('simple', word);
    result := case when result is null then word_q else result && word_q end;
    n := n + 1;
    exit when n >= 12;
  end loop;
  return result;
end;
$$;

revoke all on function public.medical_vault_ru_tsquery(text) from public;
revoke all on function public.medical_vault_ru_tsquery(text) from anon, authenticated;
grant execute on function public.medical_vault_ru_tsquery(text) to service_role;

-- similarity = rank/(rank+1), not saturated — merge by rank (RRF) in app.
create or replace function public.match_medical_vault_chunks_fts_ru(
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
  page_start int,
  page_end int,
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

  tsq := public.medical_vault_ru_tsquery(query_text);
  if tsq is null or numnode(tsq) = 0 then
    return;
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
    c.page_start,
    c.page_end,
    ts_rank_cd(c.content_tsv_ru, tsq, 32)::float as similarity
  from public.source_chunks c
  inner join public.sources s on s.id = c.source_id
  where c.content_tsv_ru @@ tsq
    and s.review_status = 'published'
    and s.rag_allowed = true
    and c.review_status in ('published', 'reviewed', 'extracted')
  order by ts_rank_cd(c.content_tsv_ru, tsq, 32) desc, c.id
  limit match_count;
end;
$$;

revoke all on function public.match_medical_vault_chunks_fts_ru(text, int) from public;
revoke all on function public.match_medical_vault_chunks_fts_ru(text, int) from anon, authenticated;
grant execute on function public.match_medical_vault_chunks_fts_ru(text, int) to service_role;

comment on function public.match_medical_vault_chunks_fts_ru(text, int) is
  'P1-4b: russian-config FTS over published rag_allowed vault with page_start/page_end; service_role only.';
