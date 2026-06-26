# @repo/medical-reference-curves

Математические референсные кривые II/III триместра (mean + SD anchors + линейная интерполяция).

## Источники

| Кривая | Источник |
|--------|----------|
| BPD, OFD, HC, AC, FL, HL | Медведев 2016, **Прил. 1** (Медведев и соавт., 1999) |
| Лат. желудочки, цистерна, мозжечок | Медведев 2016, таблица к Прил. 1, стр. 622 |

**SSOT таблицы:** `packages/medvedev-reference/data/biometry-rows.json`

## Формула преобразования таблицы → кривая

```
mean = p50
sd   = (p95 − p5) / 3.29     // z ±1.645
percentile = Φ((value − mean) / sd) × 100
MoM = value / mean
P3…P97 = mean + z × sd
```

## Как обновить данные (для Равшана)

1. Скопируйте шаблон:
   ```bash
   cp data/fetometry-intake.template.json data/fetometry-intake.json
   ```
2. Заполните недели и p5/p50/p95 (мм). Можно частично — merge по `week`.
3. Импорт + валидация + генерация кривых:
   ```bash
   cd packages/medical-reference-curves
   npm run import:intake
   ```
4. Тесты:
   ```bash
   cd ../medvedev-reference && npm test
   cd ../obstetric-engine && npm test
   ```

## Команды

| Команда | Действие |
|---------|----------|
| `npm run validate` | Проверка SSOT (p5 < p50 < p95, недели) |
| `npm run generate` | JSON-кривые из SSOT |
| `npm run import:intake` | intake → SSOT → validate → generate |
| `npm run sync` | validate + generate |

## Структура

```
biometry/   bpd, ofd, hc, ac, fl, hl
brain/      lateral_ventricle, cisterna_magna, cerebellum_transverse
data/       fetometry-intake.template.json
manifest.json
```

Не диагноз. Интерпретация — специалист.
