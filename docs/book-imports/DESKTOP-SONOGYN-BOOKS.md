# Desktop → SonoGyn Pro (4 книги)

Источники лежат на Mac в `~/Desktop/`. Импорт — Python-скрипты в `scripts/`.

| Папка Desktop | Книга | Пакет | Web-маршрут | Картинки |
|---------------|-------|--------|-------------|----------|
| `sonogyn-cervix` | Опухоли шейки: морфология и генетика | `@repo/cervix-morphology-atlas` | [/tools/refs/cervix-morphology-atlas](https://sonogyn-pro.ru/tools/refs/cervix-morphology-atlas) | `public/clinical-atlas/cervix-morpho/` |
| `sonogyn-mammology` | Каприн — национальное руководство по маммологии | `@repo/mammology-national-atlas` | `/tools/refs/mammology-national-atlas` | `public/clinical-atlas/kaprin-mammology/` |
| `sonogyn-prenatal` | Пренатальная эхография (RU) | `@repo/prenatal-echography-atlas` | `/tools/refs/prenatal-echography-atlas` | `public/clinical-atlas/prenatal-echo-ru/` (+ Supabase rewrite) |
| `sonogyn-echo` | Otto, Clinical Echocardiography 5ed (RU перевод) | `@repo/clinical-echocardiography-atlas` | `/tools/refs/clinical-echocardiography-atlas` | текст + глоссарий (без УЗИ-галереи) |

## Структура на Desktop (ожидаемая)

```
sonogyn-cervix/
  extracted/index.json + *.md     # OCR по главам
  cervix-morpho-atlas/index.csv   # 114 гисто-снимков
sonogyn-mammology/
  extracted/index.json
  page_scans_by_chapter/          # развороты JPG
  figures_index.csv
sonogyn-prenatal/
  extracted/index.json
  sonogyn-us-atlas/index.csv      # 725 УЗИ (.jpx → .jpg)
sonogyn-echo/
  extracted/index.json
  translated/*.md                   # RU главы
```

## Команды

```bash
# Все четыре (JSON + при необходимости картинки)
pnpm import:desktop-books

# По одной
pnpm import:cervix-morpho-atlas
pnpm import:kaprin-mammology-atlas
pnpm import:prenatal-echo-atlas
pnpm import:otto-echo-atlas

# Только пересобрать atlas.ru.json без копирования JPEG (быстро)
python3 scripts/import-prenatal-echo-atlas.py --skip-copy-images

# Проверка
node scripts/verify-desktop-book-imports.mjs

# Индекс «глава книги → нозологическая зона» (111 тем)
pnpm generate:book-nosology
```

## Интеграция в нозологии

- Список: `/tools/refs/nosologies` → блок **«Учебные атласы · по нозологиям»** (`#book-atlas`)
- Карточка темы: `/tools/refs/book-nosology/{id}` → атлас + связанные seed-нозологии
- Пакет: `@repo/book-nosology-registry` + `seed-nosology-bridge.json`
- На карточках клинических нozологий (16): блок «Учебные атласы» и knowledge links
```

## Ограничения (из for-sonogyn-pro.md)

- **Шейка** — гистология, не УЗИ; дополняет цервикальный модуль и образование.
- **Маммология** — OCR со сканов; BI-RADS-лексика для RU; рисунки привязаны к разворотам.
- **Пренатал** — нормы допpler/скрининг сверять с ISUOG/FMF; ~11 partial таблиц Медведева — отдельный модуль.
- **Otto** — 48 глав, перевод неполный (4 главы — заглушка); PDF не коммитится.

> Учебный контент. Не диагноз — интерпретация специалистом.
