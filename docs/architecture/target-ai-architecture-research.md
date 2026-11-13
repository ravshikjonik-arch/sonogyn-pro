# SonoGyn Pro — целевая AI-архитектура (исследование)

**Статус:** целевая схема для исследования, **не** описание уже работающих компонентов.  
**Дата:** 2026-11-04  
**Персоны:** 👨‍⚕️ врач-практик (Evidence, tools) · 🎓 студент (knowledge) · 📝 самопроверка (без PHI в LLM)  
**Связь:** enterprise audit `docs/enterprise-audit/*`, Stage2 gateway `docs/ai/gateway.md`, Evidence MVP `docs/ai/evidence-mvp-plan.md`

---

## 1. Analysis — что уже есть vs схема на фото

```text
SONOGYN PRO (Web / Mobile / Feed / Cases / Evidence / Tools)
        ↓
   AI GATEWAY  ← сейчас: in-app gateway (Colibri→Perplexity→OpenRouter)
                 цель:   LiteLLM (или совместимый OpenAI gateway)
        ↓
┌─────────────┬──────────────┬──────────────┬─────────────────┐
│ Medical RAG │ Medical      │ Medical      │ Private         │
│ Docling     │ Agents       │ Vision       │ Inference       │
│ Qdrant      │ Pydantic AI  │ OHIF         │ Colibri         │
│ Haystack    │              │ Cornerstone  │ vLLM / SGLang   │
│             │              │ MONAI        │                 │
└─────────────┴──────────────┴──────────────┴─────────────────┘
        ↓
   QUALITY & SAFETY  ← сейчас: эвристики PHI/injection + Sentry
                       цель:   Phoenix / Langfuse / Promptfoo / Ragas
        ↓
   CORE: Supabase · PostgreSQL · Storage · Workers · Vercel  ← уже есть
```

| Блок схемы | Сейчас в prod/коде | Gap |
|------------|-------------------|-----|
| App surfaces | Web+Mobile+Evidence+Tools+Cases | OK |
| AI Gateway | `apps/web/lib/ai/gateway/*` | Не LiteLLM; не все маршруты |
| Medical RAG | Keyword adapters + corpus; pgvector колонка пустая | Нет Docling/Qdrant/Haystack |
| Medical Agents | `lib/ai/agents/*`, calculators Zod | Не Pydantic AI |
| Medical Vision | US Worker + OpenRouter vision; DICOM flags; `@repo/dicom-*` | Нет OHIF/MONAI Label product |
| Private inference | Colibri sidecar wired in gateway | Не vLLM/SGLang; Colibri не prod-обязателен |
| Quality/Safety | PHI detect, prompt-injection, quotas | Нет Phoenix/Langfuse/Promptfoo/Ragas |
| Corpus refresh | Vercel crons + regulation queue | Firecrawl — только MCP example, не pipeline |
| Core infra | Supabase + Vercel + Workers path | OK как фундамент схемы |

---

## 2. Risks

| Риск | Почему важно |
|------|----------------|
| Обещать «диагноз по картинке» на невалидированных моделях | Юр./мед. дисклеймер; Vision = assist, не CDSS-диагноз |
| Заменить working Evidence adapters на «большой RAG» сразу | Регресс цитирования; copyright books |
| Поставить LiteLLM + Qdrant + Haystack без контрактов | Дублирование с текущим gateway/orchestrator |
| AGPL Firecrawl в monorepo без юр. оценки | Лицензионный риск |
| Colibri/vLLM в production architecture до метрик | CapEx без ROI; операционная сложность |
| Качество без golden-set (Promptfoo/Ragas) | «Кажется лучше» ≠ безопаснее |

---

## 3. Architecture — как это **должно** работать (4 направления)

### Поток запроса врача (целевой)

1. UI (Evidence / Chat / Tool) → API Zod → **Gateway** (модель + budget + purpose: `text|evidence|vision`).
2. Gateway выбирает маршрут:
   - **Evidence/RAG** → retrieval (адаптеры + опционально Qdrant) → synthesis **только** по citations.
   - **Agent** → typed tools (калькуляторы O-RADS/BI-RADS…) → structured JSON → UI.
   - **Vision** → de-id → job queue → viewer/worker → findings **с дисклеймером**.
   - **Private** → Colibri/vLLM если policy `local_only` / enterprise.
3. Каждый шаг пишет trace → **Langfuse/Phoenix**.
4. CI/nightly → **Promptfoo** (injection/safety) + **Ragas** (faithfulness) на golden set.
5. Ответ в UI: текст + источники + `sourced|inference|insufficient`.

### Направление 1 — AI Evidence (приоритет P0 исследования → P1 продукт)

**Цель:** обоснованные ответы со ссылками; при дыре в источниках — «недостаточно данных», не выдумка.

| Слой | Инструмент исследования | Роль в SonoGyn | Решение архитектора |
|------|-------------------------|----------------|---------------------|
| Retrieval сейчас | `@repo/evidence-retrieval` | PubMed/KR/corpus… | **Оставить** как primary adapters |
| Synthesis | Gateway + `synthesize-llm` | JSON + citations | Ужесточить claims (см. evidence-mvp-plan) |
| Eval | **Promptfoo** + **Ragas** | Golden medical prompts | **Pilot next** (не ломает prod) |
| Observability | **Langfuse** (или Phoenix) | Cost, traces, prompt versions | **Pilot** рядом с Sentry |
| Vector later | **Qdrant** | Hybrid semantic+keyword по vault | **После** Docling corpus; не вместо adapters |
| Orchestration later | **Haystack** | Specialty pipelines OB/GYN/MMG/US | Оценить vs текущего orchestrator |

**Контракт API (не менять без GO):**  
`search → citations[] → synthesize | insufficient`  
LLM **не** invent PMID/FIGO criteria.

### Направление 2 — Medical Knowledge Engine

**Цель:** книги, КР, таблицы, подписи → структурированная база (не сырой PDF в чат).

| Этап | Инструмент | Что делает | Ограничение |
|------|------------|------------|-------------|
| Ingest | **Docling** | PDF/DOCX/таблицы → structured chunks + reading order + OCR | Copyright-gated books — только vault/editor path |
| Store | Supabase `sources` / `source_chunks` + Storage | Metadata + ACL | Уже есть schema; embeddings пустые |
| Index | **Qdrant** *или* pgvector | Vectors + payload filters (specialty, guideline version, locale) | Выбрать **один** vector store на Stage 4 |
| Pipeline | **Haystack** (optional) | Chunk → embed → index → retrieve | Worker, не Vercel request |
| Refresh | **Firecrawl** (research) | Monitor МЗ/FIGO/ISUOG/FMF/ACR | AGPL + robots; prefer official APIs/RSS first; Firecrawl = ops sidecar |

**Важно:** Knowledge Engine **кормит** Evidence; врач не получает полный текст защищённых книг — только разрешённые snippets + citation.

### Направление 3 — Medical Vision

**Цель:** работа с УЗ/визуалом **без** обещания валидированного диагноза.

| Слой | Инструмент | SonoGyn fit |
|------|------------|-------------|
| Viewer | **Cornerstone3D** (уже флаги в web) → при необходимости **OHIF** | In-app viewer / DICOM workflow |
| De-id | `@repo/dicom-deident` | Обязателен до любого cloud LLM |
| Assist today | US AI Worker + OpenRouter vision + `ai_analyses` jobs | PRO, async, disclaimer |
| Label research | **MONAI Label** | Offline research: anonymized atlas + expert labels — **не** prod CDSS |
| Competitive asset | Собственная библиотека обезличенных УЗ-кейсов | Отдельный продукт/модуль; consent + ethics |

**Граница:** Vision findings = «интерпретация для специалиста», не диагноз.

### Направление 4 — AI Infrastructure

**Цель:** смена моделей, local inference, scale — без переписывания клинической логики.

| Слой | Сейчас | Цель | Когда |
|------|--------|------|-------|
| Gateway | In-app TS gateway | **LiteLLM** *или* сохранить in-app + OpenAI-compatible backends | LiteLLM — когда ≥3 потребителя вне Next **или** нужна единая admin UI cost |
| Cloud | OpenRouter, Perplexity | + Anthropic/Gemini **через** gateway ids | По мере ключей |
| Private | Colibri (research/sidecar) | Colibri → при нагрузке **vLLM** / **SGLang** | Только после $ и QPS метрик |
| Workers | Cron + `after()` | Durable queue (см. US-AI-SCALE) | 300–1000 PRO |
| Observability | Sentry + health | + Langfuse/Phoenix | Pilot ASAP для Evidence |
| Eval | Partial tests | Promptfoo + Ragas CI | Before model swaps |

**Правило замены провайдера:** бизнес-код зовёт `gatewayChatCompletion({ purpose, messages })` — не SDK конкретного вендора.

---

## 4. Карта 16 инструментов → приоритет

| # | Tool | Направление | Приоритет | Вердикт |
|---|------|-------------|-----------|---------|
| 1 | Docling | Knowledge | **High research → Stage 4 ingest** | Pilot на 1–2 открытых КР PDF |
| 2 | Qdrant | Knowledge/Evidence | **High research** | Альтернатива pgvector; выбрать одно |
| 3 | Arize Phoenix | Quality | **High pilot** | Self-host traces для RAG debug |
| 4 | Promptfoo | Quality | **High pilot** | Injection + medical golden set |
| 5 | Langfuse | Quality | **High pilot** | Cost + prompt versions (сверить с Phoenix — не оба сразу в prod) |
| 6 | Haystack | Knowledge/Evidence | Medium | После стабильного ingest; иначе overkill |
| 7 | LiteLLM | Infra | Medium | Не срочно: сначала добить текущий gateway coverage |
| 8 | Ragas | Quality | **High pilot** | Faithfulness/citation grounding |
| 9 | Pydantic AI | Agents | Medium | Исследовать; сейчас хватает Zod agents в TS |
| 10 | OHIF | Vision | Medium/low now | Если понадобится полный PACS-like viewer |
| 11 | Cornerstone3D | Vision | **Already in flags** | Развивать in-app viewer |
| 12 | MONAI Label | Vision research | Low prod / High research | Только lab atlas |
| 13 | Colibri | Private | Research | Не production-архитектура до метрик |
| 14 | vLLM | Private | Future | GPU server candidate |
| 15 | SGLang | Private | Future | Multimodal/agent server candidate |
| 16 | Firecrawl | Knowledge refresh | Research + legal | Prefer official feeds; AGPL caution |

---

## 5. Tasks — инкременты (без кода до одобрения)

| Step | Что | Результат |
|------|-----|-----------|
| **R0** | Закрыть P1 security/quotas из enterprise audit | Безопасный фундамент |
| **R1** | Evidence MVP claims + golden tests (уже в `evidence-mvp-plan`) | Проверяемые ответы **без** Qdrant |
| **R2** | Pilot **Promptfoo** + **Ragas** offline | Quality gate на CI |
| **R3** | Pilot **Langfuse** *или* Phoenix (один) на Evidence traces | Видимость $ и контекста |
| **R4** | Docling spike: 1 открытый guideline → chunks → (pgvector **или** Qdrant spike) | Decision memo vector store |
| **R5** | Унифицировать оставшиеся LLM routes через текущий Gateway | Готовность к LiteLLM позже |
| **R6** | Vision: Cornerstone UX + de-id + queue (не MONAI в prod) | Safe assist path |
| **R7** | Firecrawl/legal spike на 2 официальных сайта | Policy: allowlist sources |
| **R8** | LiteLLM / vLLM — только по метрикам R3–R5 | Optional infra |

---

## 6. Acceptance (как понять, что «так работает»)

1. Evidence: каждый clinical claim → citation **или** `insufficient`.
2. Knowledge: PDF ingest → searchable chunk с `source_id`, version, specialty; нет утечки full copyright text в клиент.
3. Vision: DICOM path требует de-id; UI disclaimer; нет «диагноз: …» без human review framing.
4. Infra: смена model id через env/gateway **без** правки калькуляторов/Evidence adapters.
5. Quality: Promptfoo suite red/green; Ragas faithfulness выше порога на golden set; Langfuse показывает cost/session.

---

## 7. Decision needed (STEP 4)

Нужно явное одобрение по пакетам (можно частично):

- **A)** Только R1–R3 (Evidence quality + observability) — рекомендуемый старт  
- **B)** A + R4 Docling/vector spike  
- **C)** Полный research track R1–R7  
- **D)** Не трогать стек; оставить схему как vision board  

Код / новые зависимости / миграции — **только после** выбора A/B/C/D.
