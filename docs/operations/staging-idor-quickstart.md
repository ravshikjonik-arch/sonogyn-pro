# Staging: EMR IDOR smoke (Phase A)

Скрипт **создаёт синтетического пациента** у user A. Не гонять против production БД без осознанного решения.

## Текущая ситуация в репо (проверено)

| Что | Значение |
|-----|----------|
| Единственный Supabase в `.env.local` / `.env.supabase-new` | ref `grnwcbyslttbrqznnunq` |
| Supabase branches | **Pro plan required** (`PaymentRequiredException` при create) |
| Preview PR | часто **403** (Vercel Protection) + те же env, что Production |

**Практичный путь без Pro:** localhost + `npm run setup:staging-idor` → synthetic users → `test:staging-emr-idor` с **`STAGING_CLEANUP=1`** (удаляет тестового пациента после прогона).

**Идеальный путь:** Supabase branch + миграции + Preview env на branch keys.

## Шаг 1 — Supabase branch (рекомендуется)

1. Dashboard → проект Sonogyn-Pro → **Branches** → Create branch (например `staging-phase-a`).
2. Записать **branch project ref** (не `grnwcbyslttbrqznnunq`, если branch даёт отдельный ref — см. Settings → General).
3. Накатить миграции: `docs/operations/staging-migration-checklist.md` (`pnpm check:migration-drift`, `npm run db:migrate` / SQL Editor на **branch**).
4. `npm run db:verify-hardening` с env, указывающим на branch (SERVICE_ROLE только staging).

> Создание branch через MCP/CLI — только по вашему явному «создай branch».

## Шаг 2 — Два тестовых пользователя

На **staging** Auth (не реальные пациенты):

- User A: email + password  
- User B: другой email + password  

Подтвердить email (Dashboard → Authentication → Users или invite).

## Шаг 3 — App URL

**Вариант A (проще):** localhost

```bash
# apps/web/.env.local → ключи branch (или отдельный .env.staging.local, не коммитить)
pnpm dev:web
# STAGING_APP_URL=http://localhost:3000
```

**Вариант B:** Vercel Preview с env vars **Preview** → Supabase URL/keys **branch**, не Production.  
Если включена Vercel Deployment Protection — добавить bypass token в URL или отключить protection для preview team (см. Vercel → Project → Deployment Protection).

Production alias **не использовать**: `sonogyn-pro-web-ravshan-s-projects3.vercel.app`.

## Шаг 4 — `.env.staging-idor`

```bash
cd apps/web
cp .env.staging-idor.example .env.staging-idor
# заполнить все поля
```

| Переменная | Назначение |
|------------|------------|
| `STAGING_APP_URL` | localhost или isolated preview |
| `STAGING_SUPABASE_PROJECT_REF` | ref branch (preflight блокирует prod ref) |
| `IDOR_USER_A_*` / `IDOR_USER_B_*` | synthetic accounts |

Опционально: `IDOR_PATIENT_A_ID` — не создавать пациента, если уже есть uuid у A.

## Шаг 5 — Прогон

```bash
cd apps/web
npm run test:staging-emr-idor
```

Ожидание: ✅ A читает своего; B получает **404** на patient и studies.

## Если застряли

| Симптом | Действие |
|---------|----------|
| Preflight: prod ref | Создать branch, обновить ref |
| sign-in HTTP 403 | Vercel protection / неверный URL |
| sign-in 401 | Неверный пароль или email не подтверждён |
| B получает 200 | **Stop** — IDOR; не мержить promote до fix RLS/API |

## Связанные документы

- `docs/operations/staging-migration-checklist.md`
- `docs/architecture/emr-teaching-boundary.md`
- PR #53 — CI stub `test:e2e:emr-idor` (не заменяет staging)
