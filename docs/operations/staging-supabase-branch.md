# Supabase branch для staging

**Статус (2026-10-17):** создание branch через API **заблокировано** — `PaymentRequiredException: Branching is supported only on the Pro plan or above`.

## Зачем branch

- Изолированная Postgres для миграций и IDOR/RLS smoke **без** записей в prod.
- Preview env в Vercel с ключами branch, не Production.

## Обход без Pro (текущий)

| Действие | Команда |
|----------|---------|
| Synthetic users | `cd apps/web && npm run setup:staging-idor` |
| EMR IDOR (localhost, cleanup) | `npm run test:staging-emr-idor` |
| Teaching PHI + auth | `npm run test:staging-teaching-phi` |

Preflight разрешает prod ref **только** для `localhost` / `127.0.0.1` и с `STAGING_CLEANUP=1` на IDOR smoke.

## Когда будет Pro

1. Dashboard → Branches → `staging-phase-a` (или MCP `create_branch` после `get_cost` / `confirm_cost`).
2. `docs/operations/staging-migration-checklist.md` — миграции на branch.
3. Vercel → Environment Variables → **Preview** → URL/anon/service branch.
4. `.env.staging-idor`: preview URL + `STAGING_SUPABASE_PROJECT_REF=<branch-ref>`.
5. Повторить `test:staging-emr-idor` и `test:staging-teaching-phi`.

## Альтернатива

Отдельный free-tier **project** (не branch) — только если осознанно ведёте второй ref и не смешиваете с prod данными.
