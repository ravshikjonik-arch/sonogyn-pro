# Какой Supabase-проект использовать для SonoGyn Pro

Рабочий проект: **Sonogyn-Pro** — `grnwcbyslttbrqznnunq`.

См. также [supabase-fresh-start.md](./supabase-fresh-start.md).

## Единственный рабочий проект для кода

| | |
|---|---|
| **Project ref** | `grnwcbyslttbrqznnunq` |
| **API** | `https://grnwcbyslttbrqznnunq.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/grnwcbyslttbrqznnunq |
| **SQL Editor** | https://supabase.com/dashboard/project/grnwcbyslttbrqznnunq/sql/new |

Подключены: `apps/web/.env.local`, `apps/mobile/.env`.

Старый `ocqlsqqloqvlzutbgrnp` — только как источник данных (ключи в `.env.local.old-supabase`). Дашборд к нему недоступен.

## Команды

```bash
cd apps/web
npm run db:project          # показать ref + ссылки
npm run db:verify-hardening # проверить hardening-миграции
npm run db:diagnose
```
