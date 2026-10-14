-- P1-2 / P1-4: knowledge_links meta, nosology seed, teaching case publish sync.
-- Requires 20260824180000_medical_source_vault.sql (knowledge_links table).

begin;

alter table public.knowledge_links
  add column if not exists meta jsonb not null default '{}'::jsonb;

create unique index if not exists knowledge_links_edge_uidx
  on public.knowledge_links (from_type, from_id, relation, to_type, to_id);

create or replace function public.sync_teaching_case_knowledge_links(p_case_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.knowledge_links (from_type, from_id, relation, to_type, to_id, meta)
  values
    (
      'teaching_case',
      p_case_id::text,
      'published',
      'web_route',
      '/cases/' || p_case_id::text,
      jsonb_build_object('kind', 'education', 'title', 'Учебный кейс в базе знаний')
    ),
    (
      'module',
      'education.case-library',
      'includes',
      'teaching_case',
      p_case_id::text,
      jsonb_build_object('kind', 'education', 'title', 'Каталог учебных кейсов')
    )
  on conflict (from_type, from_id, relation, to_type, to_id) do nothing;
end;
$$;

revoke all on function public.sync_teaching_case_knowledge_links(uuid) from public;
grant execute on function public.sync_teaching_case_knowledge_links(uuid) to authenticated;

create or replace function public.trg_cases_knowledge_base_links()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and new.knowledge_base_at is not null
    and (old.knowledge_base_at is null or old.knowledge_base_at is distinct from new.knowledge_base_at)
  then
    perform public.sync_teaching_case_knowledge_links(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists cases_knowledge_base_links_trg on public.cases;
create trigger cases_knowledge_base_links_trg
  after update of knowledge_base_at on public.cases
  for each row
  execute function public.trg_cases_knowledge_base_links();

-- Seed nosology → tool edges (mirrors packages/clinical-tools/src/knowledge-links.ts).
insert into public.knowledge_links (from_type, from_id, relation, to_type, to_id, meta)
values
  ('nosology', 'endometrioma', 'related_tool', 'web_route', '/tools/calc/rads/o-rads', '{"kind":"calculator","title":"O-RADS US v2022","description":"Калькулятор + IOTA 2026"}'::jsonb),
  ('nosology', 'endometrioma', 'related_tool', 'web_route', '/tools/refs/orads-echograms', '{"kind":"atlas","title":"O-RADS · эхограммы"}'::jsonb),
  ('nosology', 'endometrioma', 'related_tool', 'web_route', '/tools/refs/iota-terms-2026', '{"kind":"quiz","title":"IOTA 2026 · самопроверка"}'::jsonb),
  ('nosology', 'ovarian-functional-cyst', 'related_tool', 'web_route', '/tools/calc/rads/o-rads', '{"kind":"calculator","title":"O-RADS US"}'::jsonb),
  ('nosology', 'ovarian-functional-cyst', 'related_tool', 'web_route', '/tools/refs/orads-echograms', '{"kind":"atlas","title":"O-RADS · эхограммы"}'::jsonb),
  ('nosology', 'hydrosalpinx', 'related_tool', 'web_route', '/tools/calc/rads/o-rads', '{"kind":"calculator","title":"O-RADS US"}'::jsonb),
  ('nosology', 'hydrosalpinx', 'related_tool', 'web_route', '/tools/refs/exam-set-pieces', '{"kind":"quiz","title":"OBGYN exam set-pieces"}'::jsonb),
  ('nosology', 'uterine-myoma', 'related_tool', 'web_route', '/tools/mapping/uterus', '{"kind":"calculator","title":"FIGO · миома"}'::jsonb),
  ('nosology', 'uterine-myoma', 'related_tool', 'web_route', '/tools/refs/guidelines', '{"kind":"guideline","title":"КР · миома матки"}'::jsonb),
  ('nosology', 'uterine-myoma', 'related_tool', 'web_route', '/tools/refs/exam-set-pieces', '{"kind":"quiz","title":"Exam set-pieces · myometrium"}'::jsonb),
  ('nosology', 'adenomyosis', 'related_tool', 'web_route', '/tools/mapping/endometriosis', '{"kind":"tool","title":"IDEA · эндометриоз"}'::jsonb),
  ('nosology', 'adenomyosis', 'related_tool', 'web_route', '/tools/calc/gyn/endometrium', '{"kind":"calculator","title":"Эндометрий · ISUOG"}'::jsonb),
  ('nosology', 'endometrial-hyperplasia', 'related_tool', 'web_route', '/tools/calc/gyn/endometrium', '{"kind":"calculator","title":"Эндометрий"}'::jsonb),
  ('nosology', 'endometrial-hyperplasia', 'related_tool', 'web_route', '/tools/refs/guidelines', '{"kind":"guideline","title":"КР · гиперплазия эндометрия"}'::jsonb),
  ('nosology', 'cervix-pathology', 'related_tool', 'web_route', '/tools/refs/cervix-pathology', '{"kind":"education","title":"Патология шейки · модуль","description":"Цитология · скрининг · quiz"}'::jsonb),
  ('nosology', 'cervix-pathology', 'related_tool', 'web_route', '/tools/refs/quiz-hub', '{"kind":"quiz","title":"Каталог задач"}'::jsonb),
  ('nosology', 'short-cervix-pregnancy', 'related_tool', 'web_route', '/tools/calc/ob/cervical-length', '{"kind":"calculator","title":"Длина шейки матки"}'::jsonb),
  ('nosology', 'short-cervix-pregnancy', 'related_tool', 'web_route', '/tools/calc/ob', '{"kind":"calculator","title":"Срок беременности"}'::jsonb),
  ('nosology', 'fetal-growth-restriction', 'related_tool', 'web_route', '/tools/calc/ob', '{"kind":"calculator","title":"Срок · фетометрия"}'::jsonb),
  ('nosology', 'fetal-growth-restriction', 'related_tool', 'web_route', '/tools/refs/obstetric-atlas', '{"kind":"atlas","title":"Акушерский атлас"}'::jsonb),
  ('nosology', 'oligohydramnios', 'related_tool', 'web_route', '/tools/calc/ob', '{"kind":"calculator","title":"AFI / срок"}'::jsonb),
  ('nosology', 'oligohydramnios', 'related_tool', 'web_route', '/tools/refs/guidelines', '{"kind":"guideline","title":"КР · акушерство"}'::jsonb),
  ('nosology', 'polyhydramnios', 'related_tool', 'web_route', '/tools/calc/ob', '{"kind":"calculator","title":"Срок · фетометрия"}'::jsonb),
  ('nosology', 'placenta-previa', 'related_tool', 'web_route', '/tools/calc/ob', '{"kind":"calculator","title":"Акушерство · hub"}'::jsonb),
  ('nosology', 'placenta-previa', 'related_tool', 'web_route', '/tools/refs/exam-checklists', '{"kind":"quiz","title":"Exam checklists"}'::jsonb)
on conflict (from_type, from_id, relation, to_type, to_id) do update
  set meta = excluded.meta;

commit;
