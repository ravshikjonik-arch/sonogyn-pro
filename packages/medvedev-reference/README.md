# @repo/medvedev-reference

Единый источник норм и учебного слоя по **Медведев М.В. «Пренатальная эхография», 2016**.

> Не диагноз. Интерпретация — лечащим специалистом.

---

## Глава 1. I скрининг (11+0 — 13+6)

| Прил. | Показатель | Модуль |
|-------|------------|--------|
| **11** | ТВП, ДНК, IV желудочек | `medvedevFirstTrimester.ts` |
| **40** | ПИ венозного протока | `medvedevDoppler.ts` |
| **36** | ПИ маточных артерий | `medvedevDoppler.ts` |

---

## Глава 2. Фетометрия II/III

| Прил. | Показатель | Модуль |
|-------|------------|--------|
| **1** | BPD, OFD, HC, AC, FL, HL, мозг | `medvedevBiometry.ts` |
| — | EFW Hadlock IV | `medvedevBiometry.ts` |

---

## Глава 3. Анатомия II триместра

| Прил. | Модуль |
|-------|--------|
| **5–10, 12** | `medvedevSecondTrimesterAnatomy.ts` |

---

## Глава 4. Орбиты, тимус, сердце

| Прил. | Модуль |
|-------|--------|
| **13–20** | `medvedevHeartOrbits.ts` |

---

## Глава 5. Допплер

| Прил. | Показатель | Порог |
|-------|------------|-------|
| **36** | ПИ маточных | p5/p95 |
| **37** | **ИР** пуповины (RI) | p5/p95 |
| **38** | **ПССК** СМА | **>1,5 MoM** |
| **39** | ПИ СМА | p5/p95 |
| **40** | ПИ DV I скр. | min/max FMF |
| **41** | ПИ DV II/III | p5/p95 |

Модуль: `medvedevDoppler.ts`

---

## Глава 6. Плацента, воды, пальцы

| Прил. | Показатель | Срок | Модуль |
|-------|------------|------|--------|
| **33** | Длина пальцев I–V | 14–27 нед | `medvedevPlacentaAfi.ts` |
| **34** | Толщина плаценты | 14–40 нед | `medvedevPlacentaAfi.ts` |
| **35** | ИАЖ (Moore) | 16–42 нед | `medvedevPlacentaAfi.ts` |

API: `assessMedvedevPlacentaAfi`, `listPlacentaAfiAtWeek`

---

## Глава 7. Учебный слой

`medvedevTeaching.ts` — карточки, срезы, `teachHintForAlert()`

---

## Глава 8. Интеграция

| Поверхность | Путь |
|-------------|------|
| Web FMF | `/assistant/fmf` |
| Нормы | `/reference/norms` |
| Mobile | `FMFAssistantScreen`, `fmfScreening3034Examples` |
| Протокол | `fmf-protocol.ts` |

---

## Глава 9. Тесты

```bash
cd packages/medvedev-reference && npm test && npm run typecheck
```

**18 тестов** — biometry, doppler, first trimester, placenta/afi.

---

## Экспорт (`index.ts`)

```ts
export * from "./medvedevFirstTrimester";      // гл. 1
export * from "./medvedevBiometry";            // гл. 2
export * from "./medvedevSecondTrimesterAnatomy"; // гл. 3
export * from "./medvedevHeartOrbits";         // гл. 4
export * from "./medvedevDoppler";             // гл. 5
export * from "./medvedevTeaching";          // гл. 7
export * from "./medvedevPlacentaAfi";        // гл. 6
```
