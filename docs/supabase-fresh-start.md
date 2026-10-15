# Новый Supabase с нуля (Sonogyn-Pro)

## Проект

| | |
|---|---|
| **Ref** | `grnwcbyslttbrqznnunq` |
| **Имя** | Sonogyn-Pro |
| **Dashboard** | https://supabase.com/dashboard/project/grnwcbyslttbrqznnunq |
| **API** | https://grnwcbyslttbrqznnunq.supabase.co |

Старый `ocqlsqqloqvlzutbgrnp` больше не используем для dev/prod после переключения env.

## Шаг 1 — Схема (миграции)

**Рекомендуется (пустая база):** один Run в SQL Editor:

```bash
cd apps/web
npm run db:fresh-sql   # копирует BUNDLE_FOR_SQL_EDITOR.sql в буфер + открывает SQL Editor
```

**Уже частично накатано через MCP?** Не вставляйте полный bundle повторно — дождитесь донаката оставшихся файлов или:

```bash
export SUPABASE_ACCESS_TOKEN=sbp_...
export SUPABASE_PROJECT_REF=grnwcbyslttbrqznnunq
node scripts/apply-migrations-supabase-api.mjs
```

(только **последовательно**, не параллельно — иначе коллизии в `schema_migrations`.)

**С паролем БД:**

```bash
node scripts/bootstrap-new-supabase.mjs --write-env
node scripts/apply-supabase-migrations.mjs
npm run db:verify-hardening
```

## Шаг 2 — Ключи в env

1. Dashboard → **Settings → API**  
2. Файл `apps/web/.env.supabase-new` (шаблон: `.env.supabase-new.example`)  
3. ```bash
   npm run db:bootstrap-new
   ```

## Шаг 3 — Vercel (production)

**sonogyn-pro-web** → Environment Variables → Production → Supabase URL/keys → Redeploy.

## Шаг 4 — Auth / SMTP

- **Auth → URL Configuration**: `https://sonogyn-pro.ru`, `http://localhost:3000/**`  
- **Auth → SMTP**: Mail.ru для ref `grnwcbyslttbrqznnunq`

## Шаг 5 — Данные со старой базы (опционально)

```bash
npm run db:migrate-data
npm run db:bootstrap-new
```

## Проверка

```bash
npm run db:verify-hardening
npm run db:diagnose
```
