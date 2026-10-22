# Книга → платформа (96 карточек)

**Источник:** Медведев М.В. «Основы ультразвуковой фетометрии», 2016.

## Слои данных

| Слой | Путь | Назначение |
|------|------|------------|
| Скан страницы | `docs/fetometry-source/medvedev-archive/*.jpeg` (локально, gitignore) | Оригинал из `Архив.zip` |
| Web static | `apps/web/public/clinical/medvedev-archive/*.jpeg` | Prod/preview, URL `/clinical/medvedev-archive/…` |
| Каталог | `catalog.json` | 96 карточек: `tableId`, блок, тип таблицы, `filename`, `dataFile` |
| Цифры SSOT | `table-*.json` | Строки GA/CRL/оси → перцентили |
| Runtime | `@repo/medvedev-reference` | `evaluateArchiveNorm`, `listArchiveCalculatorCards` |
| UI | `/tools/calc/ob/fetometry-norms` | Каталог + расчёт + превью скана |

## Клинические блоки (`clinicalBlock`)

- `early_dating` — малый срок, dating
- `screening_i` — I скрининг
- `fetometry` — фетометрия II/III
- `doppler_late` — допплер
- `anatomy_other` — анатомия, региональные приложения (A.x)

## Синхронизация

```bash
# catalog.json ← table-*.json (sourceCard)
node packages/medical-reference-curves/scripts/sync-archive-catalog.mjs

# JPEG → public (Desktop/Архив.zip или docs/…)
node packages/medvedev-reference/scripts/sync-archive-images-to-web.mjs
```

## Статус извлечения

- **extracted** — JSON покрывает карточку для калькулятора
- **partial** — таблица на скане обрезана по срокам; расчёт в доступном диапазоне + `partialNote` в JSON

> Не диагноз. Табличный справочник; интерпретация — лечащим специалистом.
