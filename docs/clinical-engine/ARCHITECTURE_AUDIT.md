# SonoGyn Clinical Engine — аудит существующей архитектуры

**Статус:** аудит, только чтение (2026-11-06). Код не менялся.
**Связанные документы:** [O-RADS_ACR_V2022_AUDIT.md](./O-RADS_ACR_V2022_AUDIT.md), [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md),
`docs/architecture/SONOGYN_MEDICAL_INTELLIGENCE_ADR.md`, `docs/clinical-imaging-cds/ARCHITECTURE.md`, `packages/orads-us/CLINICAL_AUDIT.md`.

Обозначения достоверности: **[✓]** — подтверждено чтением кода в рамках этого аудита; **[А]** — по данным автоматизированного обзора, требует точечной проверки перед исправлением.

---

## 1. Главный вывод

Расчётные движки **уже существуют** почти для всех заявленных калькуляторов, но:

1. **Нет общего контракта** входа/результата: у каждого движка своя форма результата, статуса «incomplete / invalid / not_applicable» нет почти нигде (исключения: сетка O-RADS v2022 `category:null + missing[]`, IOTA `{ok:false, errors}`, `morphology-core` `completeness`).
2. **Значения по умолчанию маскируют отсутствие данных** в нескольких движках и UI (O-RADS Pro, начальное состояние формы O-RADS v2022, BI-RADS MMG, fetal-nomograms).
3. **Одна классификация — несколько реализаций** (O-RADS ×3, BI-RADS ×3, FIGO ×4, GA/EDD ×2, перцентильная математика ×3).
4. **Web импортирует исходники mobile** (обратная связность) вместо общих пакетов.
5. **Реестр источников и версий уже есть** (Supabase `canonical_calculator_registry` + `sources`, `docs/clinical-imaging-cds/RULES-VERSIONS.json`), но не связан с кодом движков.

Новый «движок» создавать **не нужно**. Нужен тонкий общий контракт, адаптеры существующих движков к нему и унификация UI.

## 2. Пакеты

| Запрошено | Факт |
|---|---|
| `packages/calculations` | нет; роль выполняет `packages/medical-calculations` [✓] |
| `packages/guidelines` | нет; есть `packages/clinical-guidelines` (каталог КР/приказов, без движка) [А] |
| `packages/types` | есть; Zod-схемы строк БД, API, структурированных отчётов; **схем входов калькуляторов нет** [А] |
| `packages/database` | только SQL-миграции [А] |

## 3. Инвентаризация движков

| Движок | Пакет / вход | Отсутствующие данные | Результат | Версия / источник | Тесты | Замечания |
|---|---|---|---|---|---|---|
| O-RADS — дерево решений | `orads-us/src/calculateOradsResult.ts` | путь дерева неполный → `{ok:false}` | категория 0–5, путь | комментарии «ACR O-RADS US v2022» | ~67 [А] | нет экспортируемой версии |
| O-RADS — сетка v2022 | `orads-us/src/us2022/evaluateOradsUs2022.ts` | **явно**: `category:null` + `missing[]` [✓] | категория, risk, management, rationale | — | 8 [А] | `initialOradsUs2022Input` = доброкачественные значения по умолчанию [✓] |
| O-RADS — Pro-адаптер | `orads-us/src/pro/oradsCalculator.ts` `calculateORADS` | **заглушка**: null-сетка → 3 (или 4); O-RADS 0 → 3 [✓] | категория 1–5 без статуса | — | косвенно | bilocular при 1–3 перегородках [✓]; подробности — в аудите O-RADS |
| O-RADS — mobile legacy | `apps/mobile/src/guidelines/orads-flow-rules.ts` | — | — | — | — | **третья реализация**, доступна с Home [А] |
| IOTA ADNEX / LR2 / SR / SRRisk | `iota-models` | **строгая валидация** `{ok:false, errors}` [✓] | вероятности, modelId/version/publication | `data/sources.json` (BMJ 2014, JCO 2005, AJOG 2016) | ~25 | лучший по документированности |
| BI-RADS US | `birads-us/src/birads-core.ts` | нет правила → «BI-RADS 0» [✓] | category, riskRange | локальный ruleset (не официальный атлас) [✓] | ядро без тестов [А] | подкатегории 4A–4C по одному дескриптору [А] |
| BI-RADS MMG | `birads-mmg` | неизвестные дескрипторы → **4A** [А] | category | — | 4 | — |
| breast-classification | `breast-classification` | — | — | — | 0 | мёртвый пакет [А] |
| ACR TI-RADS | `tirads-acr/src/score.ts` | нет размера → без ТАБ + подсказка [✓] | TR1–5, баллы, ТАБ | `acr-2017-v3` [✓] | 8 | `defaultTiradsAcrInput` = TR4 [А] |
| TI-RADS (RU, 2023) | `thyroid-tirads` | — | категория 1–5 | комментарий | 2 | отдельная система, не смешивать с ACR |
| LN-RADS | `ln-rads-us` | демо-значения по умолчанию [А] | категория | «SonoGyn synthesis» — **не официальная** | 0 | маркировать как внутреннюю шкалу |
| MUSA (аденомиоз) | `musa-framework` | undefined → false [А] | балл/13 | консенсус Van den Bosch 2022, балльная шкала — **собственная** | 3 | маркировать |
| FMF I триместр | `fmf/src/percentile-engine/first-trimester.ts` | параметр пропускается | перцентили, MoM | источник кривых | 4 | при отсутствии срока срок берётся из КТР, и КТР сравнивается сам с собой [✓] |
| Акушерство II–III / EFW | `obstetric-engine` | — | EFW, перцентиль | Медведев / ISUOG | 3 | **перцентиль = 50 + z·34** (линейно) [✓] |
| Медицинские калькуляторы | `medical-calculations` (EFW Hadlock, GA/EDD, Bishop, VBAC, Doppler, …) | в основном `null` | разный | JSDoc-ссылки | тест-скрипт без кавычек — запускается часть тестов [✓] | VBAC не модель MFMU [А]; ряд таблиц без источника [А] |
| Нормограммы плода | `fetal-nomograms` | при отсутствии перцентилей зона «P50_P95» [А] | zone | `MEDVEDEV_BOOK_SOURCE_VERSION` | 12 | — |
| FIGO миома | нет пакета | — | — | — | — | 4 реализации (myoma-education, clinical-3d, mobile, web-mirror) [А] |
| Шейка матки / ПЭ | в приложениях | — | — | — | — | логика в `apps/*`, нарушает «packages first» [А] |

Оркестрация: `morphology-core` (единственная модель полноты `complete|partial`), `medical-intelligence` (маршрутизация к O-RADS, BI-RADS, TI-RADS, MUSA), `clinical-tools` (каталог 44 инструмента), `report-engine` / `report-generator` (шаблоны протоколов).

## 4. Маршруты и UI

**Web** (`apps/web/app/(clinical)/tools/calc/...`; `/calculators/*` — редиректы):
O-RADS `/tools/calc/rads/o-rads` (мастер ACR-стиля + форма v2022), IOTA `/tools/calc/rads/iota`, BI-RADS `/tools/calc/rads/bi-rads`, TI-RADS `/tools/calc/rads/ti-rads`, LN-RADS, MUSA `/musa/adenomyosis`, FIGO `/tools/mapping/uterus`, акушерство `/tools/calc/ob?tab=…`, фетометрия, EFW, Bishop, VBAC, длина шейки, гинекологические калькуляторы `/tools/calc/gyn/*`.

**Mobile** (`apps/mobile/src`): O-RADS — форма v2022 по умолчанию (`OradsUnifiedScreen`), мастер (`OradsWizardScreen`) только из справочника, **legacy-поток** `ORADSFlowScreen` с локальным движком; IOTA, BI-RADS, TI-RADS, FMF, фетометрия, гинекологический роутер.

**Расхождение Web ↔ Mobile для O-RADS:** по умолчанию Web открывает мастер (дерево), Mobile — форму (сетка v2022), плюс доступен legacy-движок → один и тот же случай может получить результат от разных реализаций.

**Общие UI-блоки:** web `components/calculators/shared/calc-ui.tsx`, `CalculatorReportPanel`, `CalculatorSourcesPanel`; mobile `StepCard`, `SelectChip`, `OradsOptionCard`; `@repo/ui` калькуляторного дизайн-кита не содержит.

**Черновики:** у калькуляторов автосохранения ввода нет; есть история/избранное (`localStorage`) и сохранение результата (`calculator_entries`, RLS owner). Автосохранение есть у структурированного редактора протоколов.

## 5. Дублирование логики

| Логика | Где |
|---|---|
| O-RADS | дерево `orads-us`, сетка `orads-us/us2022`, mobile `guidelines/orads-flow-rules.ts` |
| BI-RADS | `birads-us`, `birads-mmg`, `breast-classification` |
| FIGO | `myoma-education`, `clinical-3d`, `apps/mobile/src/gynecology/figoFibroid.ts`, зеркало в `products/` |
| GA/EDD, КТР → срок | `medical-calculations`, `fmf/math.ts`, `apps/mobile/src/gynecology/pregnancyCalc.ts` |
| Перцентили / нормальное распределение | `fmf`, `medical-calculations/percentiles.ts`, `obstetric-engine` |
| Hadlock IV | `medical-calculations`, `obstetric-engine` |
| Парсер протокола O-RADS | `orads-us/parseOradsProtocolText.ts`, `apps/web/lib/orads-pro/text-parser.ts` |
| Обратная связность | `apps/web/lib/{orads-pro,cervix,endometrium,clinical-assistant}` импортируют `apps/mobile/src/**` |

## 6. Реестры и контракты, которые можно переиспользовать

- **Supabase:** `canonical_calculator_registry` (+ `_versions`, `_sources`), `sources` (copyright_status, license_notes, rag_allowed, quotation_allowed, review_status), RLS включён.
- **Файлы:** `docs/clinical-imaging-cds/RULES-VERSIONS.json`, `golden-set/`, `ARCHITECTURE.md` (инвариант «категория — только из подтверждённых признаков»).
- **Контракты результата:** `medical-intelligence` `ClassificationSection` (engineVersion, abstention, readiness), `packages/types` `StructuredCalculatorBlockSchema` (`algorithmId`, `algorithmVersion`, `immutable`), чат `ToolExecutionResult` (status, completeness, inputReview).
- **Безопасность AI:** правило «AI объясняет, движок считает» уже закреплено (TASK 05.2–05.4, PR 1).

## 7. Найденные дефекты (документированы, не исправлены)

Приоритеты: **P0** — возможно занижение риска в доступном пути; **P1** — вводящий в заблуждение результат или расхождение реализаций; **P2** — несоответствие методологии без прямого занижения; **P3** — гигиена.

| # | Дефект | Где | Приоритет | Достоверность |
|---|---|---|---|---|
| E1 | O-RADS Pro: 2–3 перегородки трактуются как bilocular (v2022: bilocular = 1 перегородка) → O-RADS 2 вместо 3–4 | `mapProInputToUs2022.ts:64` | **P0-латентный**: в активном UI недостижим (форма и мастер используют сетку/дерево); достижим через AI-чат (AI SDK выкл.), MI (флаг выкл.) и неиспользуемые компоненты `OradsProCalculator` / `OradsDualGrid`. **Блокирует включение AI SDK и MI** | [✓] |
| E2 | O-RADS Pro: O-RADS 0 выдаётся как категория 3; при нехватке данных — категория 3/4 | `pro/oradsCalculator.ts:58` | **P1** | [✓] |
| E3 | Форма O-RADS v2022 стартует с доброкачественных значений по умолчанию | `us2022/types.ts:51`, `OradsUnifiedCalculator.tsx:73` | **P1** (проверить, видны ли выбранные значения) | [✓] |
| E4 | Mobile legacy-движок O-RADS доступен с главного экрана | `ORADSFlowScreen` | **P1** | [А] |
| E5 | EFW-перцентиль линейной формулой → неверные пороги SGA/LGA | `obstetric-engine/biometry-engine.ts:120` | **P1** (уточнить, где используется) | [✓] |
| E6 | Тесты `medical-calculations` запускаются частично (glob без кавычек) | `medical-calculations/package.json` | **P1** | [✓] |
| E7 | BI-RADS MMG: неизвестный дескриптор → 4A | `birads-mmg` | P1 | [А] |
| E8 | fetal-nomograms: при отсутствии перцентилей зона «норма» | `fetal-nomograms` | P1 | [А] |
| E9 | FMF: КТР сравнивается со сроком, вычисленным из него же | `fmf/first-trimester.ts:112` | P2 | [✓] |
| E10 | BI-RADS US: ядро без тестов; подкатегории не по ACR | `birads-us` | P2 | [А] |
| E11 | LN-RADS, MUSA-балл — внутренние шкалы без явной маркировки | пакеты | P2 | [А] |
| E12 | mobile TI-RADS: 0 баллов → TR2 (в ACR TR1); вызовов нет | `apps/mobile/.../tiradsCalculator.ts:171` | P3 | [✓] |

Подробная матрица O-RADS — в [O-RADS_ACR_V2022_AUDIT.md](./O-RADS_ACR_V2022_AUDIT.md).
