# Regulation ingest — one-shot prod checklist

## 1. Supabase

- [x] Миграция `20261022120000_regulation_ingest` (таблицы `regulation_ingest_queue`, `regulation_extractions`)
- RLS: только `profiles.role = admin`

## 2. Vercel env

- `CRON_SECRET` — для `/api/cron/ingest-rf-regulations` (Пн/Чт 09:00 UTC)
- `OPENROUTER_API_KEY` или `PERPLEXITY_API_KEY` — AI извлечение
- `SUPABASE_SERVICE_ROLE_KEY` — cron ingest на сервере (уже есть для web)

## 3. Первый прогон

```bash
pnpm ingest:rf-regulations
```

Или в UI: `/admin/regulations` → **Запустить мониторинг источников**.

## 4. Review → publish

1. **Извлечь AI** (нужен текст ≥40 символов; иначе **Импорт URL** с вставкой фрагмента)
2. **Одобрить**
3. **Опубликовать в Evidence** → `guidelines_external_index` + режим Evidence «КР/НПА РФ»
4. Локально: `pnpm sync:regulations-catalog` → commit `ingested-regulations.json`

## 5. Источники

Редактировать `apps/web/config/rf-regulation-sources.json` (RSS, static_urls, html_links + фильтр АГ/УЗИ).

## Дисклеймер

AI-черновик не заменяет официальный текст приказа/КР. Публикация только после review врачом.
