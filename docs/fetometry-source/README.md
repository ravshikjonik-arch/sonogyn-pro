# Источник фетометрии Медведева

JPEG-карточки из «Основы ультразвуковой фетометрии» (2016) лежат в `medvedev-archive/`.

- Локально: распаковать `Архив.zip` → `medvedev-archive/` (96 файлов).
- SSOT JSON: `packages/medvedev-reference/data/archive-tables/`.
- Каталог: `node packages/medical-reference-curves/scripts/sync-archive-catalog.mjs`.

JPEG в git не коммитятся в `docs/` (локальный рабочий архив); копия для web:

```bash
pnpm --filter @repo/medvedev-reference sync:archive-images
```

→ `apps/web/public/clinical/medvedev-archive/` (коммитятся для prod). Цифры SSOT — JSON в `packages/medvedev-reference/data/archive-tables/`. См. `ARCHIVE-BOOK.md` там же.
