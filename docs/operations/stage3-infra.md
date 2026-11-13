# Этап 3 — Серверная инфраструктура

Дата: 2026-11-04

## Цель

Платформа выдерживает рост нагрузки: индексы, кэш справочников, фоновая обработка очереди НПА, мониторинг latency.

## Сделано в коде

| Область | Что |
|---------|-----|
| Индексы | Миграция `packages/database/supabase/migrations/20261104120000_stage3_perf_indexes.sql` (+ копия в `apps/web/supabase/migrations/`) |
| Claim worker | RPC `claim_regulation_ingest_jobs` + fallback в `lib/regulations/claim-ingest-jobs.ts` |
| Cron extract | `GET /api/cron/process-regulation-queue` (Пн/Чт 09:30 UTC в `vercel.json`) |
| Evidence cache | `createEvidenceCacheStore()` — memory + Upstash Redis |
| Guidelines cache | Redis 15 мин поверх module memory |
| Health | `GET /api/health` — DB latency probe + stage3 flags |
| Pooling docs | Prisma/`DATABASE_URL` pooler notes |

## Миграция

**Применена на prod** `Sonogyn-Pro` (`grnwcbyslttbrqznnunq`) 2026-11-04 через MCP `apply_migration` → имя `stage3_perf_indexes` (по явному запросу).

Staging branch отдельного не было (только `main`).

## Env

```bash
# уже для rate-limit — теперь ещё Evidence/guidelines cache
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Prisma / ops (если используете)
DATABASE_URL=…pooler…:6543/postgres?pgbouncer=true
DIRECT_URL=…db.…:5432/postgres
```

## Проверка

```bash
curl -s -H 'User-Agent: Mozilla/5.0' http://localhost:3000/api/health | jq .db,.stage3
```

## Вне scope этого инкремента (Этап 4 / позже)

- PDF → chunk → embedding → HNSW
- Полный вынос US `after()` на очередь (см. `US-AI-SCALE-100-1000.md`)
- Vercel Analytics / Speed Insights UI
- Автоматический reconcile Supabase performance advisors
