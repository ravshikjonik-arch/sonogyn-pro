# MEDICAL KNOWLEDGE BASE AUDIT — SonoGyn Pro

**Дата:** 2026-11-05  
**Режим:** READ-ONLY (код + миграции + ADR). Production / Supabase live data / embeddings population / полный прогон тестовых клинических запросов — **NOT VERIFIED** без staging smoke.  
**Запреты этапа соблюдены:** код, БД, индексы, migrations apply, deploy, commit — не изменялись.

Связанные документы: `docs/architecture/adr/ADR-VEC-pgvector-first.md`, `ADR-ORCH-evidence-retrieval.md`, `apps/web/docs/medical-knowledge-architecture.md`, `docs/audit/COLIBRI_CLOUDFLARE_COMPATIBILITY.md`, `docs/audit/AI_INFRASTRUCTURE_HARDENING.md`.

---

## 1. Executive Summary

В репозитории **нет одной монолитной «медицинской базы»**. Есть **три параллельных контура**:

| Контур | Суть | Зрелость |
|--------|------|----------|
| **A. Evidence Assistant** | Live multi-adapter search (PubMed, OpenAlex, КР, …) → rank → rules/LLM → citations | **Высокая** (продукт в UI) |
| **B. Static corpus** | `@repo/evidence-corpus` + `@repo/evidence-engine` keyword shelves | **Средняя** (курируемые полки) |
| **C. Medical Source Vault** | Supabase `sources` / `source_chunks` / `knowledge_articles` + pgvector | **Схема есть, ingest MVP нет** |

«Hybrid RAG» в продуктовых docs = **слияние адаптеров + опциональный vault**, а **не** FTS+dense RRF.  
Semantic vault **выключен по умолчанию** (`EVIDENCE_MEDICAL_VAULT=1`).  
Source Studio описывает Upload→chunk→review→RAG, но **upload/worker в коде не реализованы**.

**Вывод:** усиливать Evidence Assistant + довести vault ingest/editorial — не строить вторую БЗ с нуля. Бюджет $50–100: без GPU и без отдельного vector SaaS (ADR: pgvector).

---

## 2. Фактическая архитектура

```text
[Внешние API] PubMed, EuropePMC, OpenAlex, DOAJ, S2, CT.gov, Epistemonikos,
              GRLS, Roszdravnadzor, KR RF, WHO/NICE/EMA seeds
[Static]      evidence-corpus shelves
[Vault]       sources → source_files → source_chunks[.embedding]  (opt-in)
        │
        ▼  EvidenceAdapter.search (parallel)  @repo/evidence-retrieval
        ▼  dedup → rankEvidenceRecords (heuristic)
        ▼  synthesizeEvidenceAnswer (rules) | synthesizeWithLlm (web)
        ▼  citations + claims + insufficient + CDS disclaimer
        ▼  /api/evidence/assistant/ask | UI Evidence | chat postValidate

Отдельно: /api/medical-knowledge/retrieve (keyword articles + fixtures)
Отдельно: sonogyn-chat/rag-context.ts (статические BI-RADS/O-RADS сниппеты)
Отдельно: knowledge_links (навигация нозология→калькулятор/атлас)
```

**Не найдено как production path:** единый SourceAdapter-интерфейс с именем из kit; Docling→DB writer; neural reranker; multimodal image RAG.

---

## 3. Инвентаризация документов и источников

### 3.1 Пакеты

| Пакет | Роль |
|-------|------|
| `@repo/evidence-retrieval` | Orchestrator, adapters, ranker, claims |
| `@repo/evidence-corpus` | Курируемые полки (us-fmf, obgyn, cervix, mammo, onco, …) |
| `@repo/evidence-engine` | Keyword ask/search по corpus |
| `@repo/medical-knowledge` | Zod types, sanitize, copyright-guard, retrieve |
| `@repo/clinical-guidelines` | Каталог КР / regulations |
| `@repo/clinical-tools` | `knowledge-links` graph |
| Root `medical-knowledge/` | Отдельный obstetric JSON atlas (не vault package) |

### 3.2 API / UI

| Surface | Path |
|---------|------|
| Assistant ask/search | `apps/web/app/api/evidence/assistant/*`, `api/evidence/search` |
| Legacy ask (corpus only) | `api/evidence/ask` |
| Medical knowledge | `api/medical-knowledge/retrieve`, `sources/[id]` |
| Admin sources list | `api/admin/medical-knowledge/sources` |
| Source Studio | `(clinical)/admin/source-studio` |
| Evidence UI | `tools/refs/evidence*`, components/evidence/* |
| Knowledge links | `api/knowledge/links` |
| Regulation admin | `admin/regulations`, cron queue |

### 3.3 Supabase (имена объектов)

| Migration | Objects |
|-----------|---------|
| `20260629120000_evidence_retrieval.sql` | `evidence_query_log`, `guidelines_external_index` |
| `20260629140000_evidence_bookmarks.sql` | `evidence_bookmarks` |
| `20260824180000_medical_source_vault.sql` | `sources`, `source_files`, `source_chunks`, `medical_reviews`, `knowledge_articles`, `knowledge_sections`, `knowledge_sources`, `knowledge_links`, calculator registry, `rag_query_logs`, bucket `medical-source-vault` |
| `20260824180100_*_hardening.sql` | publish-review triggers, clinician catalog |
| `20261014120000_knowledge_graph_teaching_cases.sql` | `knowledge_links.meta`, teaching sync |
| `20261022120000_regulation_ingest.sql` | `regulation_ingest_queue`, `regulation_extractions` |
| `20261104140000_medical_vault_pgvector.sql` | HNSW + `match_medical_vault_chunks` (service_role) |

**UNKNOWN (prod):** применены ли все миграции; сколько строк в `source_chunks` с `embedding IS NOT NULL`.

---

## 4. Состояние обработки PDF / DOCX / OCR

| Возможность | Статус | Evidence |
|-------------|--------|----------|
| Private bucket schema | EXISTS | vault migration |
| Upload API / UI | **MISSING** | Source Studio = list + copy only |
| Docling extract | PARTIAL spike | `services/docling-ingest/run_docling_spike.py` → local JSON, не DB |
| DOCX pipeline | **MISSING** in app | — |
| OCR production | **MISSING** | atlas scripts `scripts/import-*-atlas.py` offline, не vault |
| Table/formula extract | **UNKNOWN** / not in vault path | — |
| Page numbers preserved | PARTIAL in types | citation fields `pageStart`/`pageEnd`; нет гарантии ingest |
| Multi-column PDF | **NOT VERIFIED** | нет prod ingest |
| sanitizeMedicalSource | EXISTS lib | `packages/medical-knowledge/src/sanitize.ts` — не auto post-upload |
| copyright-guard | EXISTS | блокирует «выдай главу/PDF» |

### Классификация ошибок извлечения (риски при будущем ingest)

| Класс | Пример риска | Митигация (план, не внедрять сейчас) |
|-------|--------------|--------------------------------------|
| E1 Header loss | Потеря нумерации рекомендаций КР | Structure-aware chunk + section path |
| E2 Caption mix | Подпись УЗ-снимка в тексте | Caption as content_type=caption |
| E3 Table flatten | Потеря строк критериев | Table HTML/JSON chunk type |
| E4 OCR term corruption | «O-RADS» → «0-RADS» | Medical glossary post-OCR + review |
| E5 Page unlink | Нельзя цитировать страницу | Обязательный page_number на chunk |
| E6 Duplicate chunks | Двойная индексация изданий | content hash + source_version |
| E7 Column bleed | Двухколоночный PDF | Layout-aware parser (Docling) + human review |

**Восстановление исходного фрагмента:** для live Evidence — URL/PMID источника; для vault — quote ≤480 в RPC + метаданные source; полный PDF врачу **не** отдаётся by design (copyright).

---

## 5. Структура данных (сравнение с целевой моделью)

### Уже есть (близко к Document / Chunk / Article)

| Целевое | Факт в коде/БД |
|---------|----------------|
| Document id/title/type | `sources` + Zod `SourceTypeSchema` |
| specialty | `KnowledgeSpecialtySchema` / article fields |
| year, edition, DOI/ISBN, org | `SourceCitationPublicSchema` |
| copyright_status, license, rag_allowed | vault columns |
| review_status | `raw→archived` (+ publish triggers) |
| version | sources + knowledge_articles |
| Chunks | `source_chunks` + embedding 1536 |
| medical_reviews | table with source/content version |
| Knowledge sections | `knowledge_sections` typed (US findings, classification, …) |
| Clinical Evidence statement table | **PARTIAL** — claims в runtime answer, не отдельная таблица `clinical_evidence` |
| Knowledge Topic taxonomy table | **PARTIAL** — specialties/section types; нет полной nosology topic DB для RAG |
| Superseded / Needs Update statuses | **PARTIAL** — есть archived; нет явного `superseded` / `needs_update` enum |

**Не внедрять схему автоматически** — расширять vault Zod/миграции точечно после GO.

---

## 6. Embeddings

| Элемент | Статус |
|---------|--------|
| Column `vector(1536)` | EXISTS |
| HNSW cosine | EXISTS (migration; prod apply UNKNOWN) |
| Query embed | `apps/web/lib/evidence/medical-vault-search.ts` |
| Batch embed script | `apps/web/scripts/embed-medical-vault-chunks.mjs` (env-gated) |
| Default on in Evidence | **OFF** without `EVIDENCE_MEDICAL_VAULT=1` + keys + data |
| Embedding model versioning field | PARTIAL / weak vs ideal |

---

## 7. Retrieval и RAG

| Режим | Статус | Реальность |
|-------|--------|------------|
| Keyword (APIs + corpus) | EXISTS | |
| Semantic vault | PARTIAL | flag + empty-safe |
| Hybrid product | PARTIAL | merge adapters ≠ RRF |
| Metadata filter | PARTIAL | published + rag_allowed in RPC |
| Reranking neural | **MISSING** | heuristic ranker only |
| Query rewrite | **MISSING** / weak | |
| Medical synonym normalize | PARTIAL | adapter-dependent |
| RU/EN | PARTIAL | live APIs EN-heavy; RF KR adapters; cases FTS russian elsewhere |
| Exact phrase | PARTIAL | provider-dependent |
| Classification-specific | PARTIAL | corpus shelves + calcs; not unified KB |
| Source prioritization | EXISTS | ranker boosts type/age/provider |
| Chat rag-context | EXISTS | static RADS snippets — не vault |

**Тестовые клинические запросы (MUSA, O-RADS 4, FIGO 3/4, …):** автоматический прогон в этом аудите **не выполнялся** (нет live API / запрет менять infra). Ожидаемое поведение по коду: ответ из PubMed/corpus/guidelines adapters + abstention если пусто; vault не участвует без флага.

---

## 8. Качество цитирования

| Требование | Код |
|------------|-----|
| Цитаты из retrieval | EXISTS (`EvidenceRecord[]`) |
| LLM только из предоставленных citations | EXISTS (`synthesize-llm.ts`) |
| Invalid sourced → demote inference | EXISTS (`claims.ts`) |
| Insufficient / clear claims | EXISTS |
| Strip fake PMID/URL | EXISTS (`evidence-answer-validate.ts`) |
| Rules tips = inference | EXISTS (не маскировать как КР) |
| Legacy `/api/evidence/ask` без claims | **GAP** |
| Chat agent rules-only synthesis | **GAP** vs LLM path |

---

## 9. Медицинская достоверность

Сильные стороны: дисклеймер CDS; abstention; copyright-guard; разделение sourced/inference; quote cap.

Слабые: нет авто-маппинга уровней доказательности из всех источников; нет UI маркировки «КР vs учебник vs эксперт»; противоречия источников не surface-ятся явно; смешение редакций классификаций — ответственность курации corpus/vault (нет automated edition conflict detector).

Предлагаемые ярлыки источников (план):  
`clinical_recommendation` | `international_guideline` | `systematic_review` | `primary_study` | `textbook` | `expert_material` | `sonogyn_internal` — маппить на `source_type` + новые поля после GO.

---

## 10. Контроль актуальности

| Возможность | Статус |
|-------------|--------|
| version на sources/articles | EXISTS |
| medical_reviews gate publish | EXISTS (triggers) |
| regulation queue → review | EXISTS |
| whats-new evidence | EXISTS (package) |
| Superseded / Needs Update workflow UI | **MISSING** |
| Auto detect newer PubMed/KR edition | **MISSING** |
| Не удалять старые автоматически | BY DESIGN (archived) |

Целевые статусы vs факт: Draft/Processing≈raw/processing; Pending Review≈review_required; Verified≈reviewed; Published≈published; Archived≈archived; Needs Update / Superseded — добавить позже.

---

## 11. Изображения и таблицы

| | Статус |
|--|--------|
| BI-RADS atlas images in package | EXISTS (education, not vault RAG) |
| knowledge_links → atlas routes | EXISTS |
| Multimodal retrieval image↔chunk | **MISSING** |
| Tables as first-class chunks | **MISSING** in prod ingest |
| Copyright on book images | Guard + policy: не грузить без license_notes |

---

## 12. Безопасность и права

| Контроль | Статус |
|----------|--------|
| RLS vault editor vs clinician catalog | EXISTS |
| Chunks not selectable by clinicians | EXISTS |
| match RPC service_role only | EXISTS |
| Storage private bucket | EXISTS |
| evidence_query_log own rows | EXISTS |
| rag_query_logs hash | EXISTS |
| No provider keys on client | VERIFIED pattern (server env) |
| Prompt injection sanitize | EXISTS lib |
| PHI sanitize patterns | EXISTS lib |
| Admin Source Studio not on /admin hub | **GAP** (discoverability) |
| Service role key leak risk | Residual (ops) |
| Юр. соответствие распространению книг | **NOT claimed** — Source Studio warns |

---

## 13. Тестирование и метрики

**Существует:** unit claims/ranker/vault/corpus; medical-knowledge tests; evidence-answer-validate; e2e evidence smoke; golden structural eval; soft hybrid A/B; soft RAGAS sample.

**Не существует как hardened suite:** 100 эталонных клинических Q с Recall@K / Citation Accuracy / Unsupported Claim Rate на CI.

Метрики (будущие, результатов нет):

1. Retrieval Recall@K  
2. Precision@K  
3. Citation Accuracy  
4. Source Coverage  
5. Clinical Answer Accuracy  
6. Unsupported Claim Rate  
7. Abstention Accuracy  
8. Freshness  
9. Latency  

---

## 14. Проблемы по критичности

### P0
1. Vault ingest pipeline заявлен в UI, не реализован → ложное ощущение закрытой БЗ.  
2. Semantic vault silent-empty без флага/данных.  
3. Dual API (`assistant/ask` vs legacy `ask`) разная integrity model.

### P1
4. Нет FTS на vault chunks; «hybrid» маркетинговое.  
5. Нет neural rerank.  
6. Source Studio не в admin hub; нет editorial UI reviews/chunks.  
7. Chat evidence agent без LLM synthesis path.  
8. Prod migration/embedding population UNKNOWN.

### P2
9. Нет version conflict / superseded UX.  
10. OpenFDA/DailyMed не в DEFAULT providers.  
11. Multimodal atlas не в RAG.  
12. Нет golden set 100 Q.

### P3
13. Knowledge graph richer than links.  
14. Qdrant (отложен ADR).  
15. Auto evidence grading.

---

## 15. Целевая архитектура (направление, не внедрение)

Единый **Medical Knowledge Plane**:

1. **External Evidence** (текущий orchestrator) — primary for live literature.  
2. **Closed Vault** — licensed sources → Docling/worker → review → embed pgvector → adapter.  
3. **Canonical articles** — editor-published, keyword+vector later.  
4. **Calculators / atlases** — linked via knowledge_links, not dumped into chunks.  
5. **Answer layer** — one integrity model (citations, claims, abstention) for all surfaces.

Остаться на **Supabase pgvector + Vercel**; Cloudflare только CDN/WAF; Colibri optional off.

---

## 16. План реализации (кратко)

См. `docs/audit/MEDICAL_KNOWLEDGE_BASE_IMPLEMENTATION_ROADMAP.md` (P0–P3).

Порядок: (1) честность UI/флагов + unify ask integrity → (2) minimal ingest+review for 1–2 licensed sources → (3) enable vault flag after data → (4) FTS+rerank soft → (5) admin UX → (6) eval set 100.

---

## 17. Оценка расходов (бюджет $50–100/мес)

| Вариант | Добавочная infra | AI variable | Fit бюджета |
|---------|------------------|-------------|-------------|
| **A. Минимальный** | $0 (существующие Vercel/Supabase) | OpenRouter/Perplexity как сейчас | **Да** |
| **B. Medical RAG** | $0–20 embed API; pgvector на текущем Supabase | +embed + synthesis tokens | **Да**, при редких запросах |
| **C. Multimodal + KG + full CMS** | Выше (storage, compute, editor time) | выше | **Нет** без роста бюджета |

Не рекомендовать GPU/Qdrant сейчас.

---

## 18. Риски и зависимости

| Риск | Зависимость |
|------|-------------|
| Copyright books | Юр. review до upload |
| Empty vault + flag on | Пользователь «нет источников» |
| Service role | Secret hygiene |
| Dual stacks | Dev confusion / inconsistent answers |
| OCR clinical terms | Medical editor mandatory |
| Staging≠prod migrations | Ops checklist before `EVIDENCE_MEDICAL_VAULT` |

---

## Три варианта развития (этап J)

### A — Минимальное улучшение
- Unify integrity на legacy ask; link Source Studio; docs flags; small golden eval.  
- Стоимость: низкая. Риск: низкий. Результат: честный продукт.

### B — Полноценный Medical RAG
- Ingest worker + review queue + embed job + FTS + soft rerank + vault in default adapters after data.  
- Стоимость: средняя (tokens). Сложность: средняя. Результат: закрытая БЗ + live Evidence.

### C — Расширенная платформа
- Multimodal, KG, full CMS, conflict detection.  
- Стоимость/сложность: высокая. Отложить.

**Рекомендация аудита:** начать с **A**, затем узкий **B** на 1 specialty (gyn US / O-RADS).

---

## Подтверждение

Код, БД, production, DNS, платные ресурсы и embeddings **не изменялись** в рамках этого аудита.
