# Doppler Ultrasound in the First Trimester (11–14 Weeks)

> Источник: М.В. Ситарская · ultrasoundoc.com  
> SonoGyn-Pro educational module · `/library/fetal-doppler-first-trimester`

---

## Section 1 · Introduction

### Зачем допплер в 11–14 недель

- Уточнить функциональные маркеры (венозный проток; при необходимости — трикуспидальная регургитация)
- Помочь ранней оценке сердца (потоки/наполнение, ориентация по магистральным сосудам)
- Уточнить сосуды пуповины и переднюю брюшную стенку (2 артерии у пузыря, пупочное кольцо)
- Измерить PI маточных артерий (часть скрининга риска ранней преэклампsии — см. FMF PE calculator)

**Главное правило:** допплер — только по показаниям и максимально коротко.

---

## Section 2 · Doppler Safety (ALARA)

| Параметр | Рекомендация |
|----------|--------------|
| TI | ≤ 1.0 (контроль на экране) |
| Время | до 5–10 мин на протокол |
| Порядок | Color → короткий pulsed Doppler |
| До 11 нед | избегать необоснованного спектрального допплера |

**Практика:** маленький color box, минимальная глубина, scale/PRF без «заливки». При плохой визуализации — сменить доступ (TV/TA), а не «дожимать» допплером.

---

## Section 3 · Five Extended Doppler Positions

1. **Fetal heart** — 4CV + 3VT color
2. **Ductus venosus** — PI + A-wave
3. **Umbilical arteries** — 2 arteries at bladder
4. **Umbilical ring** — if suspected AWD
5. **Uterine arteries** — PI R/L → mean

---

## Sections 4–8 · Detailed protocols

См. TypeScript-модуль `sections.ts` и UI `/library/fetal-doppler-first-trimester`.

---

## Section 9 · Common Pitfalls

- VP ↔ hepatic veins
- Large color box / long exposure
- Wrong bladder level for SUA
- UTA: wrong vessel, angle > 30°
- Single marker without context

---

## Section 12 · Assessment

- 16 MCQ в `quiz-bank.ts`
- Oral questions в `FETAL_DOPPLER_ORAL_QUESTIONS`
- 9 cases в `cases.ts`

---

## Section 13 · Visual Atlas

`/public/images/fetal-doppler/*.png` — см. README в папке.
