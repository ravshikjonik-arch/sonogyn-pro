# SonoGyn Open Source Intelligence Audit

**Режим:** READ-ONLY · 2026-11-04  
**Цель:** сопоставить 16 OSS-проектов с монорепозиторием без установок и без ломки ядра.  
**Принцип:** чужие репозитории **усиливают** SonoGyn core (калькуляторы, классификации, vault, expert review), **не заменяют** его.

Связанные документы: `target-ai-architecture-research.md`, `docs/enterprise-audit/*`, `docs/ai/gateway.md`, `docs/ai/evidence-mvp-plan.md`.

---

## 0. Ядро SonoGyn (не трогать / не дублировать)

| Ядро | Где в монорепо | OSS не должен |
|------|----------------|---------------|
| Клинические калькуляторы / O-RADS / BI-RADS / IOTA / FIGO | `packages/orads-us`, `birads-*`, `iota-models`, `medical-calculations`, … | Переписывать формулы в LLM-агенте |
| Evidence adapters + rank | `packages/evidence-retrieval` | Заменять LangChain/Haystack «с нуля» |
| Evidence corpus / shelves | `packages/evidence-corpus`, `evidence-engine` | Игнорировать ради «чистого RAG» |
| AI Gateway Stage 2 | `apps/web/lib/ai/gateway/*` | Ломать failover ради LiteLLM в день 1 |
| Medical source vault schema | `source_chunks.embedding vector(1536)` + reviews | Бросать схему ради Qdrant без bake-off |
| Expert review workflow | `medical_reviews`, knowledge articles | Автопубликация без врача |
| DICOM de-id / viewer hooks | `packages/dicom-deident`, `dicom-viewer`, feature flags | Диагноз без валидации |
| US vision jobs | `services/us-ai-worker`, `/api/ai/analyze` | Подменить MONAI Label в prod CDSS |
| App shell | Next.js 16 web, Expo mobile, Supabase, Vercel | Тянуть Python frameworks в request path |

---

## 1. Ваша очередь vs рекомендация архитектора

Ваш порядок (продуктовый смысл — верный):

| # | Вы | Архитектор (та же цель, меньше риска) |
|---|-----|----------------------------------------|
| 1 | Docling | **1a** Promptfoo+Ragas на **текущем** Evidence (без новых сервисов) |
| 2 | Qdrant или pgvector | **1b** Docling spike → чанки в **существующий** vault |
| 3 | Phoenix | **2** pgvector bake-off (**до** Qdrant) |
| 4 | Promptfoo+Ragas | **3** Один из: **Langfuse (MIT)** *или* Phoenix (ELv2) |
| 5 | LiteLLM | **4** Добить coverage текущего Gateway; LiteLLM — позже |
| 6 | Haystack / Pydantic AI | **5** Только после метрик retrieval; **один** orchestration стиль |
| 7 | OHIF / Cornerstone | **6** Углубить Cornerstone/dicom-viewer; OHIF — по потребности PACS |
| 8 | Colibri / vLLM | **7** Research sidecar; не три движка сразу |

**Почему 1a перед Docling:** ни Docling, ни Qdrant не делают ответы клинически достоверными. Сначала цитирование + golden tests на том, что уже в `@repo/evidence-retrieval` (`evidence-mvp-plan.md`). Docling сразу после / параллельно как **отдельный worker PR**.

---

## 2. Карточки проектов (OSS intel)

Статусы: **ADOPT** · **PILOT** · **DEFER** · **REJECT** · **ALTERNATIVE**  
Совместимость: Next/Expo = через API/worker, не npm-встраивание Python в SSR.

### 2.1 Docling — PILOT (очередь #1 ingest)

| | |
|--|--|
| URL | https://github.com/docling-project/docling |
| License | **MIT** (веса/OCR-модели — отдельные лицензии) |
| Activity | Очень высокая; v2.146.0 (2026-11-03); IBM / LF AI |
| Risks | Тяжёлый Python+OCR; не для Vercel request; GPU optional |
| Compat | Worker/Docker рядом с monorepo; пишет в Supabase vault |
| Дублирует | Частично ручной/legacy ingest; **не** Evidence adapters |
| Интеграция без rewrite | Да: `source_files` → Docling → `source_chunks` → review_status |
| Cost | CPU worker $20–80/mo spike; OCR GPU optional |
| PR plan | `services/docling-ingest` spike → 1 открытый КР PDF → staging only |

### 2.2 Qdrant — DEFER until bake-off · ALTERNATIVE to pgvector

| | |
|--|--|
| URL | https://github.com/qdrant/qdrant |
| License | **Apache-2.0** |
| Activity | Высокая; hybrid dense+sparse native |
| Risks | Второй stateful store; sync с Postgres; ops |
| Compat | Отдельный сервис; Next ходит по HTTP |
| Дублирует | Задуманный путь `source_chunks.embedding` + HNSW в Supabase |
| Решение | **Сначала pgvector** на том же corpus Docling; Qdrant только если p95/filter/scale не тянет |
| Cost | Self-host RAM-heavy или Qdrant Cloud |

### 2.2b pgvector (уже в проекте) — ADOPT path first

| | |
|--|--|
| Evidence | Extension `vector` 0.8.2 installed; column `embedding vector(1536)`; **нет** app writer/HNSW |
| License | PostgreSQL License (extension) |
| Вердикт | **Default vector store** для Stage 4; нужен embed pipeline + index, не новый продукт |

### 2.3 Arize Phoenix — PILOT (один из двух observability)

| | |
|--|--|
| URL | https://github.com/Arize-ai/phoenix |
| License | **Elastic License 2.0 (ELv2)** — self-host OK; **нельзя** отдавать Phoenix третьим лицам как managed service |
| Activity | Активный; OTel/OpenInference; лёгкий Docker (SQLite→PG) |
| Risks | Не OSI; Dynatrace/Arize корпоративный контекст — следить за roadmap |
| Дублирует | Langfuse, частично Sentry |
| Вердикт | Хорош для **внутренней** RAG-отладки; для SaaS-трассировки клиентов юридически проще Langfuse |

### 2.4 Langfuse — ALTERNATIVE / PREFERRED for product SaaS

| | |
|--|--|
| URL | https://github.com/langfuse/langfuse |
| License | **MIT** core; EE modules commercial |
| Risks | Self-host тяжелее (ClickHouse+PG+Redis+blob) **или** Cloud |
| Вердикт | **Рекомендуемый один** для prod observability SonoGyn; не ставить вместе с Phoenix |

### 2.5 Promptfoo — ADOPT (eval/CI)

| | |
|--|--|
| URL | https://github.com/promptfoo/promptfoo |
| License | **MIT** (часть OpenAI; остаётся OSS) |
| Activity | Высокая; CI-friendly; red-team |
| Compat | Node CLI в monorepo/`apps/web` scripts; бьёт в staging API |
| Дублирует | Частично `ai-assistant-hardening` tests — дополняет, не заменяет |
| Cost | Compute CI + дешёвые LLM tokens на eval |
| PR | `promptfoo` config + 20 golden medical cases; gate soft→strict |

### 2.6 Ragas — ADOPT (RAG metrics)

| | |
|--|--|
| URL | https://github.com/vibrantlabsai/ragas |
| License | **Apache-2.0** |
| Compat | Python eval job; не в Next runtime |
| Дублирует | Нет в prod |
| PR | Offline eval на Evidence fixtures; faithfulness/groundedness thresholds |

### 2.7 LiteLLM — DEFER (gateway maturity first)

| | |
|--|--|
| URL | https://github.com/BerriAI/litellm |
| License | **MIT** OSS gateway; каталог `enterprise/` — **proprietary** (SSO/SCIM и т.д.) |
| Risks | Путаница OSS vs Enterprise; ещё один Python proxy |
| Дублирует | `apps/web/lib/ai/gateway/*` (failover, cost, quotas) |
| Вердикт | Сначала довести in-app Gateway на все routes; LiteLLM Proxy — когда нужен multi-app admin UI / 100+ model keys |

### 2.8 Haystack — DEFER

| | |
|--|--|
| URL | https://github.com/deepset-ai/haystack |
| License | **Apache-2.0** |
| Дублирует | `searchEvidenceUnified` orchestrator + adapters |
| Вердикт | Не ставить рядом с LangChain/LlamaIndex. Рассматривать **после** Docling+vector, если pipelines станут сложнее adapters |

### 2.9 Pydantic AI — DEFER

| | |
|--|--|
| URL | https://github.com/pydantic/pydantic-ai |
| License | **MIT** |
| Дублирует | TS agents + Zod tools (`lib/ai/agents`, calculator ACL) |
| Вердикт | Python-агенты только если появится отдельный agent worker; клинические решения остаются на пакетах-калькуляторах |

### 2.10 OHIF Viewers — DEFER / optional product

| | |
|--|--|
| URL | https://github.com/OHIF/Viewers |
| License | **MIT** |
| Risks | Тяжёлый фронт; PACS-like scope |
| Дублирует | Частично `packages/dicom-viewer` + Cornerstone flags |
| Вердикт | Когда нужен полноценный radiology workstation UX |

### 2.11 Cornerstone3D — PILOT / deepen existing

| | |
|--|--|
| URL | https://github.com/cornerstonejs/cornerstone3D |
| License | **MIT** |
| Evidence in repo | Feature flags `dicomViewer` в `integration-rollout.ts` |
| Вердикт | Развивать текущий путь; не ждать OHIF |

### 2.12 MONAI Label — REJECT for production CDSS · RESEARCH lab only

| | |
|--|--|
| URL | https://github.com/Project-MONAI/MONAILabel |
| License | **Apache-2.0** |
| Risks | Нет валидации под AГ-УЗИ задачи; легко «пообещать диагноз» |
| Вердикт | Только офлайн-лаборатория обезличенных кейсов |

### 2.13 Colibri — PILOT research sidecar (не prod-обязателен)

| | |
|--|--|
| URL | https://github.com/JustVugg/colibri |
| License | **Apache-2.0** (веса моделей — отдельно; часть non-commercial) |
| Activity | Взрывной рост; open issues ~150+; молодой (2026) |
| Risks | Ops/диск сотни GB; модель licenses; нестабильность API |
| Evidence | Уже в Gateway resolve как optional |
| Вердикт | Исследовать; **не** три инференс-движка сразу |

### 2.14 vLLM — DEFER (GPU server candidate)

| | |
|--|--|
| URL | https://github.com/vllm-project/vllm |
| License | **Apache-2.0** |
| Stars | ~96k; industry standard serving |
| Cost | GPU instance $300–2000+/mo |
| Вердикт | Когда QPS/economics оправдают; OpenAI-compatible → тот же Gateway |

### 2.15 SGLang — DEFER / ALTERNATIVE to vLLM

| | |
|--|--|
| URL | https://github.com/sgl-project/sglang |
| License | **Apache-2.0** |
| Вердикт | Не ставить вместе с vLLM+Colibri. Выбор **одного** serving engine по бенчмарку |

### 2.16 Firecrawl — REJECT self-host in monorepo · CAUTION cloud API

| | |
|--|--|
| URL | https://github.com/mendableai/firecrawl |
| License | Engine **AGPL-3.0**; SDKs часто MIT |
| Risks | AGPL copyleft при self-host/modify; robots/ToS официальных сайтов |
| Evidence | Только MCP example keys, не pipeline |
| Вердикт | Prefer RSS/official APIs + существующие regulation crons; Firecrawl Cloud SDK — юр. review; **не** vendoring AGPL server в SonoGyn |

### 2.17 Явно отклонить (даже если «модно»)

| Проект | Почему REJECT |
|--------|----------------|
| **LangChain** | Дублирует Evidence orchestrator; тяжёлый abstraction tax |
| **LlamaIndex** | То же; нарушает правило «один подход» |
| **Haystack + LangChain + LlamaIndex вместе** | Запрещено архитектурой |
| **Qdrant + pgvector dual-write «на всякий»** | Двойная правда |
| **Phoenix + Langfuse одновременно** | Двойной ops |
| **Colibri + vLLM + SGLang одновременно** | Три infra без метрик |
| **MONAI в prod diagnostic UX** | Нет clinical validation |
| **Firecrawl AGPL в monorepo** | Лицензионный риск |
| **LiteLLM Enterprise без контракта** | Proprietary folder |

---

## 3. Совместимость с стеком (сводка)

| Технология | Next 16 | Expo | Supabase | Monorepo pattern |
|------------|---------|------|----------|------------------|
| Docling | via Worker API | N/A | Write chunks | `services/*` |
| pgvector | PostgREST/RPC | N/A | Native | migrations |
| Qdrant | HTTP client | N/A | Sync metadata | sidecar |
| Promptfoo | CI/scripts | N/A | Hits staging | root/devDep |
| Ragas | CI Python | N/A | Read fixtures | `services/eval` |
| Phoenix/Langfuse | OTel SDK | limited | Optional | sidecar/cloud |
| LiteLLM | OpenAI baseURL | same | — | sidecar |
| Haystack/Pydantic | Worker only | N/A | — | Python service |
| Cornerstone/OHIF | Web yes | limited | Storage DICOM | apps/web |
| Colibri/vLLM/SGLang | Gateway URL | same | — | GPU host |
| Firecrawl | API only | — | — | avoid AGPL vendor |

---

## 4. Затраты (порядок величин, не invoice)

| Этап | Infra | OpEx/мес (грубо) |
|------|-------|------------------|
| Promptfoo+Ragas CI | GitHub Actions + cheap LLM | $20–150 tokens |
| Langfuse Cloud или Phoenix Docker | 1 small VM / Cloud | $0–50 self / Cloud tier |
| Docling worker | 2–4 vCPU, 8–16GB | $20–80 |
| pgvector embed | Same Supabase + embed API | Embed $ + DB storage |
| Qdrant (если понадобится) | 8–32GB RAM node | $40–200+ |
| LiteLLM proxy | small VM | $10–40 (+ Enterprise $) |
| Colibri lab | Big disk + RAM/GPU | CapEx heavy |
| vLLM/SGLang prod | 1×A10/A100+ | $300–2000+ |

**Поддержка:** 0.25–1 FTE на AI platform при Stage Docling+observability; +GPU owner при private inference.

---

## 5. План внедрения — отдельные PR / checks (ничего не ставить без GO)

### Wave 0 — защита ядра (из enterprise audit, параллельно)

- PRs: profiles RLS, open-access off, DEFINER revoke, quota fail-closed  
- Check: `test:security`, advisors recount  

### Wave 1 — качество Evidence **без** новых vector DB

| PR | Содержание | Check |
|----|------------|-------|
| PR-E1 | Evidence claims / insufficient (MVP plan) | Unit + manual Evidence UI |
| PR-E2 | Promptfoo golden set (injection, no invented criteria, citations) | Soft CI job |
| PR-E3 | Ragas offline on fixtures | Script + threshold report |
| PR-E4 | Выбрать **Langfuse *или* Phoenix**; instrument Evidence ask only | Trace 1 happy path |

**GO нужен на:** E2–E4 deps.

### Wave 2 — Knowledge ingest (ваша очередь #1–2)

| PR | Содержание | Check |
|----|------------|-------|
| PR-K1 | `services/docling-ingest` spike, 1–2 **открытых** PDF | Chunks in staging vault |
| PR-K2 | Embed job → `source_chunks.embedding` + HNSW/IVF | Explain + recall@k |
| PR-K3 | Hybrid: vector + existing keyword adapters behind `searchEvidenceUnified` | A/B quality vs adapters-only |
| PR-K4 | **Decision memo:** stay pgvector **or** introduce Qdrant | Written ADR |

### Wave 3 — Gateway / agents / vision (позже)

| PR | Содержание | Check |
|----|------------|-------|
| PR-G1 | Все LLM routes → in-app Gateway | Grep OpenRouter clean |
| PR-G2 | LiteLLM proxy optional behind same interface | Failover test |
| PR-A1 | Haystack **или** Pydantic worker — только если ADR | No dual framework |
| PR-V1 | Cornerstone UX + de-id gate | No PHI to cloud |
| PR-V2 | OHIF — product decision | Scope review |
| PR-I1 | Colibri lab runbook | Not default prod |
| PR-I2 | vLLM **xor** SGLang bake-off | One winner |

### Wave 4 — отклонено по умолчанию

Firecrawl AGPL vendor, MONAI prod, dual observability, dual vector DB, LangChain/LlamaIndex.

---

## 6. Architecture decision records (нужны до install)

1. **ADR-VEC:** pgvector first; Qdrant trigger = measured failure (latency/scale/filters).  
2. **ADR-OBS:** Langfuse vs Phoenix — выбрать один; для SaaS предпочтительно MIT Langfuse.  
3. **ADR-ORCH:** Keep `@repo/evidence-retrieval`; Haystack only with explicit gap analysis.  
4. **ADR-INF:** One private inference backend at a time; Gateway stays stable OpenAI-compatible.  
5. **ADR-CORE:** Calculators and classifications remain TypeScript packages; agents call them as tools.

---

## 7. Что внедрять в первую очередь (короткий ответ)

1. **Не ставить всё подряд.**  
2. **Сейчас (максимум ценности / минимум ломки):** Promptfoo + Ragas + один observability + Evidence citation MVP.  
3. **Следом (ваш #1–2):** Docling worker → pgvector hybrid; Qdrant только после bake-off.  
4. **Потом:** Gateway coverage → LiteLLM optional.  
5. **Позже:** один из Haystack/Pydantic; Cornerstone deepen; OHIF по продукту.  
6. **Research only:** Colibri; затем vLLM **или** SGLang.  
7. **Отклонить:** LangChain/LlamaIndex, dual stacks, Firecrawl AGPL in-repo, MONAI-as-diagnosis.

---

## 8. Решение для следующего шага

Выберите пакет (код только после этого):

| Код | Что делаем |
|-----|------------|
| **GO-W1** | Wave 1 only (eval + obs + Evidence MVP) — **рекомендуется** |
| **GO-W1+K1** | Wave 1 + Docling spike (без Qdrant) |
| **GO-FULL-RESEARCH** | Все ADR + spikes в отдельных ветках, всё ещё без merge в main |
| **HOLD** | Только этот документ; установок нет |

Мастер-промпт для повторного READ-ONLY прогона не обязателен: этот файл — результат расследования. При необходимости обновлять после смены лицензий/релизов.
