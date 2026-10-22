# Regulation ingest (RF) — SonoGyn Pro

MVP: мониторинг источников → очередь → AI-черновик → **admin review** → ручной merge в `@repo/clinical-guidelines`.

## Компоненты

| Часть | Путь |
|-------|------|
| Миграция | `packages/database/supabase/migrations/20261022120000_regulation_ingest.sql` |
| Источники | `apps/web/config/rf-regulation-sources.json` |
| Cron ingest | `apps/web/scripts/ingest-rf-regulations.mjs` |
| Vercel cron | `GET /api/cron/ingest-rf-regulations` (Пн/Чт 09:00 UTC), `CRON_SECRET` |
| Admin UI | `/admin/regulations` |
| Zod | `apps/web/lib/regulations/extraction-schema.ts` |

## Операции

```bash
pnpm ingest:rf-regulations -- --dry-run
pnpm ingest:rf-regulations
```

После миграции на Supabase: импорт URL в UI или cron. «Извлечь AI» требует `OPENROUTER_API_KEY` или `PERPLEXITY_API_KEY`.

## Безопасность

- RLS: только `is_admin()` на queue/extractions.
- Нет auto-publish в prod guidelines.
- Не логировать полные тексты приказов в клиентские каналы.

## Level 3

- **Опубликовать в Evidence** (`POST /api/admin/regulations/publish`) после статуса `approved` → `guidelines_external_index` (`source=rf_regulation`) + статус `published`.
- Локально: `pnpm sync:regulations-catalog` → `ingested-regulations.json` → merge в `@repo/clinical-guidelines`.
- Evidence: adapter `rf_regulation` в режимах КР/НПА РФ.

## Фильтр мониторинга

Ingest пропускает документы без ключевых слов АГ/УЗИ (см. `relevance-keywords.ts`). Рубрикатор КР — всегда включается (`static_urls`).
