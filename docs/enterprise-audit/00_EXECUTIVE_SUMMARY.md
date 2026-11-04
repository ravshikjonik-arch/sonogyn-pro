# SonoGyn Pro — Enterprise Infrastructure Audit

**Дата аудита:** 2026-11-04  
**Режим:** read-only (код, migrations, Supabase MCP metadata/advisors). Без SQL mutations, без платных AI-вызовов, без изменений production config.  
**Проект БД:** `Sonogyn-Pro` (`grnwcbyslttbrqznnunq`), region `eu-west-1`, Postgres **17.6**, status `ACTIVE_HEALTHY`.  
**App layer:** Vercel `fra1` (`apps/web/vercel.json`), monorepo pnpm/turbo.

---

## Вердикт по масштабу

| Цель | Готовность | Условие |
|------|------------|---------|
| **1 000** зарегистрированных | **Условно готово** | Prod: `NEXT_PUBLIC_OPEN_ACCESS_FULL=false`, Upstash обязателен, квоты AI на всех LLM-маршрутах, закрыть profiles SELECT |
| **10 000** | **Не готово** | Нужны: durable US-analyze queue, SQL-агрегация квот, staging branch/Pro, throttling Evidence adapters, triage SECURITY DEFINER RPC |
| **100 000+** | **Не готово** | Hybrid: workers + object storage + org tenancy + observability SLO + DR/PITR plan; не «больше серверов», а смена architecture bottlenecks |

**Текущий размер prod (snapshot MCP `list_tables`, 2026-11-04):** ~60 `profiles`/`users`, 15 teaching `cases`, EMR `patients`/`studies` = 0 rows, ~1799 `storage.objects`, `ai_chat_events` = 0. Платформа на ранней нагрузке; узкие места — architectural, не «уже упало».

---

## Что уже готово

1. Monorepo с SSOT калькуляторов в `packages/*` + Next.js web (~194 API routes) + Expo mobile.
2. Supabase Auth + RLS на EMR (`patients`/`studies` own-row) + API ownership checks.
3. AI Gateway Stage 2 в коде: Colibri → Perplexity → OpenRouter (`apps/web/lib/ai/gateway/*`).
4. Evidence multi-adapter + Redis cache hooks (`packages/evidence-retrieval`, `apps/web/lib/evidence/redis-cache-store.ts`).
5. Stage 3 indexes + `claim_regulation_ingest_jobs` применены на prod (`stage3_perf_indexes`).
6. Rate limit fail-closed без Upstash в prod (`apps/web/lib/security/rate-limit.ts`, `production-secrets.ts`).
7. CI: typecheck, clinical tests, security e2e, webpack build (`.github/workflows/ci.yml`).
8. PHI guards + teaching-case publish anonymization trigger.

## Что не готово

1. pgvector установлен (`vector` 0.8.2), колонка `source_chunks.embedding` есть, **нет** embed pipeline / HNSW / app reader (1 chunk row).
2. US analyze на `after()` serverless — не durable queue (`apps/web/app/api/ai/analyze/route.ts`).
3. Split LLM: gateway не покрывает tutor / orads / vision / worker paths.
4. Нет staging Supabase branch (только `main`).
5. Vercel MCP team scope пуст в этой сессии (SSO) — env names на prod не верифицированы через MCP.
6. Advisors: **65** SECURITY DEFINER callable by `anon`/`authenticated`; **171** `auth_rls_initplan`; **78** unindexed FKs.

## Исправить немедленно (P0/P1)

| ID | Проблема | Приоритет |
|----|----------|-----------|
| SEC-P1-01 | `profiles_select_authenticated USING (true)` | **P1** |
| SEC-P1-02 | Open-access default `true` в коде | **P1** (prod env) |
| SEC-P1-03 | `AUTH_RATE_LIMIT_RELAXED` не блокируется prod-guard | **P1** |
| SEC-P1-04 | SECURITY DEFINER RPC executable by anon (advisor ×65) — triage critical (`backfill_all_reputation`, `apply_moderation_penalty`, …) | **P1** |
| AI-P1-01 | Quota bypass если нет service role (`cost-control.ts`) | **P1** |
| OPS-P1-01 | Включить HaveIBeenPwned leaked password protection (advisor) | **P1** |

*P0 exploitable «прямо сейчас» при корректном prod env + применённых миграциях — не подтверждён статикой; P1 выше — обязательны до роста.*

## Какую инфраструктуру использовать сейчас

| Слой | Выбор |
|------|--------|
| App | **Vercel** Next.js Fluid Compute, region `fra1` |
| DB/Auth/Storage/Realtime | **Supabase** managed Postgres + pooler `:6543` |
| Rate limit / Evidence cache | **Upstash Redis** (обязателен в prod) |
| LLM | OpenRouter (+ Perplexity) через in-app Gateway; Colibri — optional sidecar |
| Vision heavy | Optional **US AI Worker** (Railway/Fly), не на каждый HTTP |
| Observability | Sentry (опционально) + `/api/health` |

**Не делать сейчас:** миграция на «свой сервер», покупка GPU-парка, установка Colibri как обязательного prod dependency, pgvector RAG в прод без Stage 4 плана.

## Когда увеличивать мощности (измеряемые триггеры)

| Метрика | Порог | Действие |
|---------|-------|----------|
| `/api/health` DB latency p95 | > 200 ms sustained | Review indexes / plan upgrade Supabase |
| AI 429 / quota rejects | > 5% chat requests | Raise limits *or* fix cost path; not blind scale |
| US analyze job fail/timeout | > 2% или queue wait > 30s | Phase 2 worker queue (`US-AI-SCALE-100-1000.md`) |
| Upstash / Vercel function errors | spikes correlated with concurrency | Raise plan / split workers |
| Realtime connections | approach plan limit | Channel sharding / presence throttle |
| Registered users | ~1k → review; ~3–5k concurrent peaks | Org quotas + durable jobs |

## Путь к 100 000+

1. Закрыть P1 security (profiles, open-access, DEFINER RPC, password leak).
2. Унифицировать все LLM через Gateway + metering.
3. Durable background (regulation уже claim-RPC; US analyze → queue).
4. Staging + load tests (синтетика, не prod).
5. Optional private GPU / Colibri pool — **за** adapter interface, не в Next.js process.
6. Org/tenant isolation для B2B ЛПУ; retention & DR documented.

Подробности: документы `01`–`09` в этой папке.

---

## Метод и ограничения

- Evidence: код репозитория, `list_*` / `get_advisors` Supabase MCP, `apps/web/vercel.json`, `.env.example` (**имена** переменных).
- Не проверялись: фактические значения Vercel env, PITR/backup plan в dashboard, live OpenRouter spend, нагрузочные тесты.
- Snapshot advisors: `_advisor_snapshot.json`.
