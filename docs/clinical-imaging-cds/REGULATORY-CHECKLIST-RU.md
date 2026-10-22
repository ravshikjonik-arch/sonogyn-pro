# Регуляторика — вопросы до App Store / публичного CDS

> Не юридическая консультация. Для подписи RA/юриста.

## РФ (152-ФЗ, Росздравнадзор)

- [ ] Класс риска ПО как медизделия (если «оценка риска ЗНО» для клинического решения)?
- [ ] Регистрация / декларирование vs «информационная система для врачей»?
- [ ] Локализация ПДн, DPA с облаком (Vercel, Supabase, Fly worker).
- [ ] Согласие на обработку изображений; запрет обучения на пользовательских снимках без opt-in.

## App Store / Google Play

- [ ] Описание: «assistive tool for licensed clinicians», не «diagnoses cancer».
- [ ] Скриншоты без категорий как «диагноз»; видимые дисклеймеры.
- [ ] Medical disclaimer в metadata.

## EU MDR / FDA (если экспорт)

- [ ] Intended use statement (decision support vs diagnosis).
- [ ] Clinical evaluation / PCCP для ML-компонента.
- [ ] Post-market surveillance, версионирование правил.

## Продуктовые меры уже в коде

- Дисклеймеры report-generator, assistive meta в API.
- PHI text guard; EXIF strip на assist routes (CDS v2).
- Human-in-the-loop wizard/grids.

## Открыто

- OCR маска ФИО на пикселях.
- Формальный risk management file (ISO 14971).
- Golden-set clinical validation report.
