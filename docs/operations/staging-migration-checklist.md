# Staging migration & safety checklist

**Production не трогаем** без отдельного GO.  
**SSOT:** `apps/web/supabase/migrations/` — `docs/architecture/migrations-source-of-truth.md`

## 1. Pre-flight

- [ ] Подтверждён **staging** project ref (не prod) — `docs/supabase-which-project.md`.
- [ ] Ветка содержит нужные SQL; `pnpm check:migration-drift` — green.
- [ ] Backup staging (Dashboard → Database → Backups) или зафиксирован PITR timestamp.
- [ ] `.env.staging` / `apps/web/.env.local` указывает на staging (не коммитить секреты).

## 2. Review SQL

- [ ] `cd apps/web && npm run db:bundle` — просмотреть diff bundle vs last apply.
- [ ] Новые файлы только добавляют объекты; нет destructive DROP prod-only data без runbook.

## 3. Apply (staging only)

```bash
cd apps/web
npm run db:migrate          # или пофайлово в SQL Editor
```

- [ ] Миграции применены в порядке timestamp.
- [ ] Нет ошибок `already exists` без идемпотентности (исправить SQL, не форсить prod).

## 4. Verify schema & hardening

```bash
cd apps/web
npm run db:verify-hardening   # SERVICE_ROLE staging only
```

Ожидаемо: ✅ lifecycle RPC, audit tables, protocol lifecycle column, knowledge_links.

## 5. RLS & scenarios (synthetic)

- [ ] `cd apps/web && npm run test:staging-emr-idor` (см. `.env.staging-idor.example` — создайте `.env.staging-idor` локально, не в git).
- [ ] User A: создать patient → User B: `GET /api/patients/{id}` → **404**.
- [ ] Teaching: `npm run test:staging-teaching-phi` (PHI create/publish → **400**, patients list → **401**).
- [ ] Trust/reputation: `cd apps/web && npm run test:smoke-staging-trust` (alias `test:staging-trust`) — выводит **API URL** и **Dashboard** проекта; схема + HTTP `/api/verify/status` при `IDOR_USER_A_*`.
- [ ] Если smoke падает по схеме: `npm run db:migrate:trust` (или SQL Editor → `supabase/BUNDLE_TRUST_ONLY.sql`), затем `node scripts/backfill-reputation.mjs`.
- [ ] Ref sanity: `npm run db:project`.
- [ ] Supabase branch (Pro): см. `docs/operations/staging-supabase-branch.md` — пока **blocked**, localhost smoke OK.

## 6. App smoke

```bash
pnpm --filter @repo/web test:security
PLAYWRIGHT_SECURITY_E2E=true pnpm --filter @repo/web test:e2e:security
```

## 7. Logs & secrets

- [ ] Runtime logs / Sentry sample — нет телефонов, email пациентов, токенов.
- [ ] `logEvidenceQuery` — без полного текста PHI в production log level.

## 8. Stop criteria

**Остановить promote**, если:

- verify-hardening ❌ на RPC/таблицах hardening;
- IDOR: чужой patient/study readable;
- миграция частично применилась и schema inconsistent.

## 9. Rollback

- Supabase: restore backup / PITR на staging.
- В репозитории **нет** auto-down migrations — откат только через restore или compensating SQL (review + staging first).

## 10. Production (отдельное GO)

- [ ] Staging checklist полностью ✅ (isolated DB — после Pro branch; см. closeout).
- [x] **Запись closeout:** [`staging-closeout-2026-10-18.md`](./staging-closeout-2026-10-18.md) — SHA `e98492b9`, hardening ✅, localhost smokes ✅.
- [ ] Apply prod только по окну изменений с мониторингом.

### Быстрый localhost-пакет (повтор)

```bash
npm run check:migration-drift
cd apps/web && npm run db:verify-hardening && npm run test:security
npm run setup:staging-idor   # если нет .env.staging-idor
npm run test:staging-emr-idor && npm run test:staging-teaching-phi
PLAYWRIGHT_SECURITY_E2E=true npm run test:e2e:security
PLAYWRIGHT_SECURITY_E2E=true npm run test:e2e:emr-idor
```
