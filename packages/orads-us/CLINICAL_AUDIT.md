# O-RADS US v2022 — клинический аудит дерева (Фаза 1)

**Источник:** ACR O-RADS Ultrasound Risk Stratification and Management System v2022.  
**Пакет:** `@repo/orads-us` · `src/oradsDecisionTree.ts`

## Критические пороги (проверено)

| Порог | Значение в дереве | Статус |
|-------|-------------------|--------|
| Solid / papillary projection height | **≥3 мм** считается, **<3 мм** — нет | ✅ |
| Papillary projections (unilocular) | **≥4 pp** → O-RADS 5 | ✅ |
| Color score | IOTA **1–4** на финальных ветках с vascularity | ✅ |
| ROM строки | 0 / <1% / 1–<10% / 10–<50% / ≥50% | ✅ |

## Исправлено после ревью

1. **Multilocular + irregular без solid** — раньше мог уйти в O-RADS 3; по таблице ACR → **O-RADS 4**. Добавлен узел `step3_multilocular_irregular_solid_gate`.
2. **Unilocular non-simple <10 см без solid** — финал **O-RADS 2** (не O-RADS 3).

## Что проверить глазами (Равшан)

- [ ] Simple cyst: постменопауза **>5 см** → O-RADS 3 (`post_gt5`)
- [ ] Bilocular irregular → O-RADS 4 (без доп. вопросов)
- [ ] Solid lesion irregular contour → O-RADS 5
- [ ] Physiologic follicle/CL **≤3 см** → O-RADS 1
- [ ] Extraovarian typical → O-RADS 2 + дисклеймер «корреляция с клиникой»

## Открытые пункты (Фаза 2 UI)

| Пункт | План |
|-------|------|
| **O-RADS 0** (`step0_technical`) | Опциональный первый экран «технически неадекватно» |
| **Ascites / peritoneal nodules** | Модификатор поверх результата (`step_modifier_*`), не в основном дереве |
| **Доля solid ≥80%** | Отдельный вопрос для ветки «преимущественно солидное» |
| **Подтип classic benign** | Dermoid / endometrioma / hemorrhagic — для атласа эхограмм |
| **ES / FR / AR переводы** | RU + EN полные; ES/FR частично; AR — ревью носителя |

## Захват «экрана УЗИ» (Фаза 3 — реалистичность)

**Нельзя** программно снять скриншот с **отдельного** монитора аппарата (Philips/GE/Samsung), если телефон не подключён как DICOM/PACS клиент.

**Реалистичный сценарий для продукта:**

1. `expo-image-picker` — **камера** или **галерея** (уже есть в `CaseScreen.tsx`)
2. Врач фотографирует экран аппарата или импортирует freeze-frame из галереи
3. Опционально: crop + EXIF strip + **без** автоматического OCR PHI на сервер без согласия

Не обещать в UI «захват монитора УЗИ» — формулировка: **«Добавить фото снимка»**.

## PHI в чате врачей (юридический блок)

**До production** (RU / EN / ES / FR / AR — разные режимы):

- Минимизация данных: **без ФИО, даты рождения, номера карты** в публичном чате
- Pseudonym case ID + de-identified images
- Политика хранения, право на удаление, DPA/BAA с Supabase/Vercel
- Отдельное **согласие врача** на публикацию кейса
- **Не юридическая консультация** — нужен review с юристом по 152-ФЗ / GDPR / HIPAA-like требованиям

---

*Инструмент поддержки решения. Интерпретация O-RADS — ответственность специалиста.*
