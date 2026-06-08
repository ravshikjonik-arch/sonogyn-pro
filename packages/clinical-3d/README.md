# @repo/clinical-3d

Единый пакет 3D-клинических моделей SonoGyn Pro.

## Статус

| Орган | Статус | Источник |
|-------|--------|----------|
| Матка | **legacy** в `@clinical/uterus` / `apps/mobile/.../uterus3d` | миграция запланирована |
| Молочная железа | процедурная `BreastModel` | новый |
| Беременность | FMF биометрия + заготовки | новый |
| Яичники | IOTA + O-RADS типы | новый |
| Шейка / придатки | заготовки | новый |

## Миграция (не ломая импорты)

1. `@clinical/uterus` остаётся источником истины для матки до v0.2.
2. Новые органы — только `@repo/clinical-3d`.
3. Re-export из `@repo/clinical-3d` → `@clinical/uterus` на этапе 2.

## Гайдлайны в коде

- FIGO PALM-COEIN (Munro 2011/2018)
- IOTA Simple Rules (Timmerman 2008)
- O-RADS US v2022 (ACR)
- BI-RADS US (ACR)
- FMF / INTERGROWTH-21st биометрия

Допплер — отдельный виджет, не смешивается с процентилями биометрии.
