# Бэкап и восстановление (Supabase + Vercel)

Прод SonoGyn: **Supabase** (БД / Auth / Storage) + **Vercel** (web). Не заменяем это локальным Docker Postgres.

## 1. Что бэкапить

| Слой | Что | Где |
|------|-----|-----|
| Postgres | Схема + данные (пациенты, протоколы, chat…) | Supabase Dashboard → Database → Backups / PITR |
| Storage | Снимки, media чата | Supabase Storage buckets + offline копия при необходимости |
| Auth | Пользователи | Входит в DB backup; отдельно — экспорт users при инциденте |
| Env | Секреты Vercel | Vercel → Project → Settings → Environment Variables (экспорт вручную, не в git) |
| Код | Git | `github.com/ravshikjonik-arch/sonogyn-pro` |

## 2. Ежедневно / по плану

1. **Pro/Team Supabase:** включить PITR (Point-in-Time Recovery); проверить окно хранения.
2. **Free/ограниченный план:** перед миграциями — ручной backup (Dashboard → Backups) или `pg_dump` через pooler **только staging**, prod — с явным GO.
3. Перед `db:migrate` на staging: чеклист `docs/operations/staging-migration-checklist.md`.
4. Раз в неделю: убедиться, что последний automatic backup «зелёный» в Dashboard.

## 3. Восстановление (кратко)

1. Определить целевой project (staging vs prod) — `docs/supabase-which-project.md`.
2. Dashboard → Database → Backups → Restore **или** PITR на timestamp.
3. Проверить RLS: `npm run db:verify-hardening` (staging credentials).
4. Smoke: `/api/health`, вход, пациент (синтетика), чат.
5. Если сломан только web: Vercel → Deployments → Promote previous **READY** deployment (см. `docs/RELEASE_CHECKLIST.md`).

## 4. Чего не делать

- Не коммитить дампы БД и `.env` с секретами.
- Не `DROP`/`TRUNCATE` prod без явного разрешения и бэкапа.
- Не путать staging project ref с production.

## 5. Связанные файлы

- `docs/operations/staging-migration-checklist.md`
- `docs/architecture/migrations-source-of-truth.md`
- `LAUNCH_CHECKLIST.md`
- `apps/web/app/api/health/route.ts`
