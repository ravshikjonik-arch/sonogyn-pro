# Волна 01 — доверие калькуляторов (26.11.2026)

## Сделано

| Область | Изменение |
|---------|-----------|
| **КТР** | Диапазон датировки **5–84 мм** (`gestationalAge`, `validation`, UI `ObCalcHub`); предупреждение при сроке **>14 нед.** |
| **Источники** | Панель источников на вкладке КТР; Hadlock → PubMed **3879946**; ключи `ob-crl`, `ob-hub` |
| **Маршруты** | Канонические **`/tools/calc/*`** в `appointment-calculators`, `clinical-tools` catalog/modules, `navigation-links`, mobile `openClinicalTool` |
| **ДЗМ** | Полка **4 активные карточки** + шаблон в `draft` (`orders-dzm.ts`) |
| **КР МЗ РФ** | +4 карточки акушерства (преэклампсия, КС, ЗРП, ПР) |

## Не в этой волне

- Книжный RAG (03), дом «Приём» (04), diff КР + Telegram (02)
- Полный RADS-аудит по `rads-reference.ts` (задача 7 аудита)
- AFI/допплер в публичном хабе (задача 9)

## Проверка

```bash
cd packages/medical-calculations && node --import tsx --test "src/**/*.test.ts"
# открыть /tools/calc/ob?tab=crl — КТР 4 → ошибка, 45 → срок; >14 нед. — предупреждение
# /tools/refs/guidelines — счётчики полок ДЗМ и КР
```