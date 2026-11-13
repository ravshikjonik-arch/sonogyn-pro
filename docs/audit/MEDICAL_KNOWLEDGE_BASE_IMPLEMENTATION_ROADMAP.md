# MEDICAL KNOWLEDGE BASE — Implementation Roadmap

**Дата:** 2026-11-05  
**Основание:** `docs/audit/MEDICAL_KNOWLEDGE_BASE_AUDIT.md`  
**Статус:** код P0–P1(+P2 scaffold) в ветке; **prod migrate / EVIDENCE_MEDICAL_VAULT / re-embed — только по GO**.  
**Не делать без GO:** migrations apply, re-embed all, prod vault flag, удаление документов.

---

## Принципы

1. Не создавать параллельную вторую БЗ.  
2. Усиливать `@repo/evidence-retrieval` + vault schema.  
3. pgvector first (ADR-VEC); Qdrant отложен.  
4. Один integrity model ответов (citations / claims / abstention).  
5. Бюджет $50–100: без GPU и vector SaaS.

---

## P0 — критические (честность и целостность)

| ID | Проблема | Решение | Файлы / пакеты | Зависимости | Сложность | DoD | Тесты |
|----|----------|---------|----------------|-------------|-----------|-----|-------|
| P0-1 | Source Studio обещает ingest, которого нет | UI: статус «schema only / fixtures»; убрать ложный pipeline как готовый | `admin/source-studio/page.tsx` | — | S | Текст честный; нет upload claim | smoke admin |
| P0-2 | Legacy `/api/evidence/ask` без claims/insufficient | Прокси на assistant pipeline или тот же synthesize+validate | `api/evidence/ask/route.ts` | evidence-retrieval | M | Same integrity as assistant | unit + e2e |
| P0-3 | Vault semantic silent empty | Явный `vaultStatus` в API/UI; docs ops checklist перед флагом | `medical-vault-search.ts`, Evidence UI | migration applied UNKNOWN | S | Клиент видит disabled/empty reason | unit |
| P0-4 | Chat evidence agent только rules | Опционально LLM synthesize + postValidate (как assistant) | `lib/ai/agents/evidenceRetrieval.ts` | AI gateway | M | Abstention + citations | unit validate |

---

## P1 — обязательные улучшения

| ID | Проблема | Решение | Файлы / пакеты | Зависимости | Сложность | DoD | Тесты |
|----|----------|---------|----------------|-------------|-----------|-----|-------|
| P1-1 | Нет prod ingest | Worker: upload→extract(Docling/service)→chunks `review_required`→sanitize | `services/docling-ingest`, new API admin upload | P0-1, legal license | L | 1 лицензированный источник end-to-end на staging | integration staging |
| P1-2 | Нет editorial UI | Queue: chunk review, medical_reviews approve, publish article | admin routes + `medical_reviews` | P1-1 | L | Publish blocked without approved review (triggers already) | e2e author |
| P1-3 | Source Studio не в /admin hub | Ссылка в admin page | `admin/page.tsx` | — | S | Discoverable | smoke |
| P1-4 | Нет FTS на vault | `tsvector` + GIN на `source_chunks.content` + merge score | new migration (GO), retrieval | P1-1 data | M | Keyword hits RU/EN on vault | SQL + unit |
| P1-5 | Heuristic-only rank | Soft cross-encoder или LLM rerank top-N (feature flag) | evidence-retrieval ranker | tokens budget | M | Flag off by default; A/B soft eval | eval soft |
| P1-6 | Embed population | Documented runbook + gated script; enable `EVIDENCE_MEDICAL_VAULT` after N chunks | `embed-medical-vault-chunks.mjs`, ops doc | P1-1, OpenAI/OR embed key | M | Status shows embedded count | script dry-run |
| P1-7 | Dual retrieval UX | Docs + single «Evidence» entry; deprecate confusion | UX copy, redirects soft | P0-2 | S | One primary path | — |

---

## P2 — функциональное развитие

| ID | Проблема | Решение | Файлы | Deps | Сложность | DoD | Тесты |
|----|----------|---------|-------|------|-----------|-----|-------|
| P2-1 | Нет golden set 100 Q | Создать JSON eval: ob/gyn/breast/US; metrics harness | `packages/evidence-retrieval/eval/` | — | M | 100 items schema filled (≥25/specialty) | CI soft |
| P2-2 | Source type labels | Map source_type → clinician-facing label (КР/гайдлайн/…) | types + UI | — | S | Labels in citations | unit |
| P2-3 | Superseded / Needs Update | Extend review_status + UI banner | migration GO + admin | P1-2 | M | Old edition marked, still queryable | unit |
| P2-4 | OpenFDA/DailyMed default optional specialty | Config profile `drug_labels` | orchestrator | — | S | Opt-in corpus mode | unit |
| P2-5 | Query rewrite / synonyms | Small RU/EN synonym map for RADS/FIGO/MUSA | evidence-retrieval | P2-1 | M | Golden recall↑ | eval |
| P2-6 | Regulation → vault/guidelines publish | Harden queue → published guidelines | regulation admin | existing | M | Approved extraction searchable | e2e admin |

---

## P3 — расширенные возможности

| ID | Проблема | Решение | Deps | Сложность | DoD |
|----|----------|---------|------|-----------|-----|
| P3-1 | Нет multimodal RAG | Image assets linked to chunk_id + caption embed | P1, copyright | L | Atlas figure citeable |
| P3-2 | Knowledge graph beyond links | Topic nodes + conflict edges | P2 | L | Diff FIGO editions surfaced |
| P3-3 | Full CMS | Rich Source Studio (OCR fix, reindex, stats) | P1-2 | L | Admin metrics dashboard |
| P3-4 | Qdrant | Only after ADR triggers | measured fail | L | ADR update |
| P3-5 | Auto evidence grading | Only when source provides grade | P2-2 | M | No invented grades |

---

## Рекомендуемая последовательность (после GO)

```text
Week 1–2:  P0-1, P0-3, P1-3, P0-2
Week 3–5:  P1-1 staging (1 source), P1-2 MVP review, P1-6
Week 6–7:  P0-4, P1-7, P1-4
Week 8+:   P1-5 flag, P2-1 golden 100, then reassess C
```

---

## Оценка стоимости добавок

| Работа | Infra $ | Основной cost |
|--------|---------|---------------|
| P0 | 0 | eng time |
| P1 ingest+embed | 0–20/mo embed API | eng + medical editor time |
| P2 eval/labels | 0–10 | eng |
| P3 multimodal/CMS | значимо | **вне** $50–100 без роста бюджета |

---

## Прогресс реализации (локально, 2026-11-05)

| ID | Статус |
|----|--------|
| P0-1 Source Studio honest UI | **done** |
| P0-2 Legacy ask integrity | **done** |
| P0-3 Vault status on assistant GET | **done** (+ `ftsFlag`, `runbook`) |
| P0-4 Chat evidence LLM + postValidate | **done** (`evidenceRetrieval.ts`) |
| P1-1 Text ingest API | **done** (`/api/admin/medical-knowledge/ingest`) — PDF/OCR later |
| P1-2 Source Studio review UI MVP | **done** (ingest + chunks + publish/reject) |
| P1-3 Admin hub link | **done** |
| P1-4 FTS migration file | **done** (`20261105120000_medical_vault_fts.sql`) — **not applied** |
| P1-5 Soft rerank | **deferred** |
| P1-6 Embed runbook | **done** (`docs/ops/MEDICAL_VAULT_EMBED_RUNBOOK.md`) |
| P1-7 Dual UX cleanup | **deferred** (partial honesty copy) |
| P2-1 Golden ≥100 | **done** scaffold (`eval/golden-prompts.json`) |
| P2-2 Source type labels | **done** (`sourceTypeLabel`) |
| Prod migrate / `EVIDENCE_MEDICAL_VAULT` | **blocked** — нужен GO |

## Критерии старта реализации

- [x] Владелец одобрил фазу A (минимальную очередь).  
- [x] Владелец: «делай дальше до конца» (код P0–P1 без prod migrate).  
- [ ] Юр. OK на конкретные источники для vault.  
- [ ] Staging Supabase: vault + pgvector + FTS migrations verified.  
- [ ] Явный запрет на prod migrate/reindex без отдельного GO.
