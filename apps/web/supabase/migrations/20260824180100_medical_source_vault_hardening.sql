-- Hardening: clinician citation RLS, publish-without-review guard, fixture review records.

-- Clinicians may read bibliographic metadata for published RAG-eligible sources only.
-- Does NOT expose source_files, source_chunks, or storage paths.
create policy sources_select_published_catalog on public.sources
  for select to authenticated
  using (review_status = 'published' and rag_allowed = true);

-- Explicit security invoker so view RLS follows the querying user (Postgres 15+).
alter view public.source_catalog_public set (security_invoker = true);

-- Approved medical reviews for synthetic test fixtures (required by publish triggers below).
insert into public.medical_reviews (
  id, entity_type, entity_id, status, notes, reviewed_at, source_version, content_version
) values
(
  '99999999-9999-9999-9999-999999990001',
  'source',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001',
  'approved',
  'Synthetic test fixture — infrastructure QA only.',
  now(),
  '1.0.0-test',
  null
),
(
  '99999999-9999-9999-9999-999999990002',
  'source',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002',
  'approved',
  'Synthetic test fixture — infrastructure QA only.',
  now(),
  '1.0.0-test',
  null
),
(
  '99999999-9999-9999-9999-999999990003',
  'knowledge_article',
  'dddddddd-dddd-dddd-dddd-dddddddd0001',
  'approved',
  'Synthetic demo article — infrastructure QA only.',
  now(),
  null,
  '1.0.0-test'
)
on conflict (id) do nothing;

create or replace function public.enforce_source_publish_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.review_status = 'published'
    and (tg_op = 'INSERT' or old.review_status is distinct from 'published') then
    if not exists (
      select 1
      from public.medical_reviews mr
      where mr.entity_type = 'source'
        and mr.entity_id = new.id
        and mr.status = 'approved'
        and coalesce(mr.source_version, new.version) = new.version
    ) then
      raise exception 'source publish blocked: approved medical_reviews record required for version %', new.version;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists sources_enforce_publish_review on public.sources;
create trigger sources_enforce_publish_review
  before insert or update of review_status, version on public.sources
  for each row
  execute function public.enforce_source_publish_review();

create or replace function public.enforce_knowledge_article_publish_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published'
    and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    if not exists (
      select 1
      from public.medical_reviews mr
      where mr.entity_type = 'knowledge_article'
        and mr.entity_id = new.id
        and mr.status = 'approved'
        and coalesce(mr.content_version, new.version) = new.version
    ) then
      raise exception 'knowledge_article publish blocked: approved medical_reviews record required for version %', new.version;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists knowledge_articles_enforce_publish_review on public.knowledge_articles;
create trigger knowledge_articles_enforce_publish_review
  before insert or update of status, version on public.knowledge_articles
  for each row
  execute function public.enforce_knowledge_article_publish_review();
