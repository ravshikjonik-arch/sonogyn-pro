# @repo/medical-reference-curves

Математические референсные кривые II/III триместра (mean + SD anchors + линейная интерполяция).

## Источники

| Кривая | Источник |
|--------|----------|
| BPD, OFD, HC, AC, FL, HL | Медведев 2016, **Прил. 1** (Медведев и соавт., 1999) |
| Лат. желудочки, цистерна, мозжечок | Медведев 2016, таблица к Прил. 1, стр. 622 |
| PDF «Скрининг 18–21 нед» | скан без OCR — цифры сверены с книгой |
| Uzicenter 30–34 н. | протокол; кривые дополняются на этапе 2 |

## Формула преобразования таблицы → кривая

```
mean = p50
sd   = (p95 − p5) / 3.29     // z ±1.645
percentile = Φ((value − mean) / sd) × 100
MoM = value / mean
P3…P97 = mean + z × sd
```

## Генерация

```bash
cd packages/medical-reference-curves && npm run generate
```

## Структура

```
biometry/   bpd, ofd, hc, ac, fl, hl
brain/      lateral_ventricle, cisterna_magna, cerebellum_transverse
manifest.json
```

Не диагноз. Интерпретация — специалист.
