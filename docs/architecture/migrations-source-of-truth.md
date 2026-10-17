# Migrations — source of truth

**Статус:** принято (Phase A, 2026-10-17)  
**SSOT:** `apps/web/supabase/migrations/*.sql`

## Правила

1. **Новые и изменённые миграции** добавляются только в `apps/web/supabase/migrations/`.
2. **Зеркало** `packages/database/supabase/migrations/` — копия для `@repo/database` и документации; обновляется командой:

   ```bash
   pnpm --filter @repo/database sync-from-web
   ```

3. **CI** падает при расхождении: `pnpm check:migration-drift` (см. `scripts/check-migration-drift.mjs`).
4. **Деплой / SQL Editor / bundle:** `apps/web/scripts/apply-supabase-migrations.mjs`, `npm run db:migrate`, `npm run db:bundle` в `apps/web`.
5. **Запрещено** переименовывать или удалять уже применённые на production файлы миграций без отдельного runbook совместимости.

## Почему web, а не packages/database

- README приложения, bundle и apply-скрипты уже ссылаются на `apps/web/supabase/migrations`.
- В web-дереве полный набор (60+ файлов), включая evidence, AI hardening, medical vault.
- Mirror отставал и содержал дубликаты с другими timestamp (например `cases_orads_tags`).

## Проверка перед merge

```bash
pnpm check:migration-drift
pnpm --filter @repo/web test:security
```
