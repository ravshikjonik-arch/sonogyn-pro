# Release checklist — web (Vercel + Supabase)

Перед promote на production. Дополняет корневой `LAUNCH_CHECKLIST.md` (SaMD / полный запуск).

## A. Код и проверки

- [ ] Ветка смержена / задеплоена с нужного SHA
- [ ] `pnpm typecheck` / `pnpm lint` (или CI green)
- [ ] Критичные e2e: auth, security smoke, CPI при затрагивании
- [ ] Нет секретов в diff; `.env*` не в git

## B. Продукт / клиника

- [ ] Дисклеймеры «справочно, решение врача» на AI / Evidence / помощнике
- [ ] Copyright: нет новых книжных PDF/сканов (`docs/prompts/02-copyright.md`)
- [ ] «Исслед. AI» ведёт на `/ai/consultants`, не на OSS-дамп

## C. Инфра

- [ ] Vercel Production env: Supabase, Upstash, Stripe webhook, Turnstile (если включён)
- [ ] `AUTH_RATE_LIMIT_RELAXED` **не** на Production
- [ ] `/api/health` → ok после деплоя
- [ ] Supabase: нужные миграции на **нужном** project; RLS advisors без критичных дыр
- [ ] Бэкап / PITR актуален — `docs/BACKUP.md`

## D. Выкатка и откат (Vercel)

1. Preview или production deploy с нужного git SHA (`create_deployment` / Git integration).
2. Smoke: логин, калькулятор, Исслед. AI, чат (синтетика).
3. **Откат:** Vercel → Deployments → предыдущий READY → Promote / Instant Rollback.
4. При инциденте БД — `docs/BACKUP.md`, не «чинить» prod SQL вслепую.

## E. Мониторинг

- [ ] Sentry (если включён) видит новый release
- [ ] Нет всплеска 5xx в Runtime Logs после выкладки

## Связанное

- `docs/BACKUP.md`
- `docs/operations/staging-migration-checklist.md`
- `docs/security/phase-a-ops-checklist.md`
- `docs/prompts/06-release.md`
