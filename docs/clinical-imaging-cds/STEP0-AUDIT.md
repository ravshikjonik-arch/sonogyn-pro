# Шаг 0 — аудит модуля анализа снимков (SonoGyn Pro)

Дата: 2026-10-22. Статус: **базовый аудит + CDS v2 (код)**. Полный golden-set и SaMD — **открытые пункты**.

## 1. Что есть в репозитории

| Компонент | Путь | Роль |
|-----------|------|------|
| US AI Worker | `services/us-ai-worker` | LLM/CV агенты (gyn, breast, fetal…), DICOM, SonoNet |
| Web vision client | `apps/web/lib/ai/us-vision/` | `/analyze`, Zod-схема ответа |
| Gyn photo → O-RADS | `gyn-ultrasound-assist.ts`, `/api/ai/gyn-assist`, `OradsPhotoPanel` | Worker → текст → `runOradsAssistPipeline` → **hints + categoryNumber из дерева** |
| Breast photo → BI-RADS | `breast-ultrasound-assist.ts`, `BiradsImageAssistPanel` | Worker → NLP `assistFromFreeText` → **engine в @repo/birads-us** |
| Детерминированные движки | `@repo/orads-us`, `@repo/birads-us`, `@repo/report-generator` | Калькуляторы, wizard, Pro, черновики |
| Human-in-the-loop | `OradsAssistPanel`, wizard `applyHints`, feature grids | Врач подтверждает шаги |
| PHI guard | `reject-phi-payload`, UI «без ФИО» | Текстовые поля, не OCR на пикселях |
| EXIF strip | `strip-image-metadata.ts` (sharp) | Подключено в CDS v2 `prepare-frames` |

## 2. Слабые места (до CDS v2)

| Риск | Было | После CDS v2 (этот PR) |
|------|------|-------------------------|
| Категория с vision | `orads`/`birads` на кадре, scorecard в текст | **Sanitize** + промпты worker без категории; merge без O-RADS/BI-RADS из кадра |
| QC фото | только `image/*` | **runImagingQc** + optional `IMAGING_CDS_STRICT_QC` |
| De-ID | EXIF не на всех AI routes | **prepareImagingFramesForAnalysis** перед assist API |
| Правила в YAML | TS/JSON в пакетах | Реестр версий `RULES-VERSIONS.json`; полный YAML — backlog |
| Golden set / метрики | нет | **manifest.example.json**, `scripts/imaging-cds-eval.mjs` |
| SaMD docs | частично | `REGULATORY-CHECKLIST-RU.md`, `MODEL-CARD-US-AI-WORKER.md` |
| OCR burned-in PHI | не реализовано | **Открыто** — только EXIF + текстовый PHI guard |
| Applicability (ТМ, EP…) | в UI/текстах | **Открыто** — формальные gates в API |
| BI-RADS v2025 MRI 4A–4C | US модуль | **Вне scope** фото-pipeline |
| FIGO staging по фото | не заявлено | OK — только миома/калькуляторы |

## 3. Сверка версий (ориентиры, не замена официальных PDF)

| Система | В коде | Замечание |
|---------|--------|-----------|
| O-RADS US | v2022 | Дерево + Pro; папилляры 1–3 vs ≥4 согласованы с wizard |
| IOTA | consensus assist 2026 | Triangulation, не полный Wiley ADNEX везде |
| BI-RADS US | brochure 2025 module | NLP + brochure engine; worker раньше ссылался на 2013/2024 |
| FIGO миома | FIGO 2018 classifier | Стадирование рака по фото **не делаем** |

**Рекомендация:** ежеквартальная сверка с ACR Atlas / IOTA publications; изменения — через `RULES-VERSIONS.json` + тесты пакетов.

## 4. План этапов (6–10)

1. ✅ **CDS v2 контракт** — QC, de-ID, sanitize vision, промпты worker (этот коммит).
2. **Applicability API** — Zod-gates: беременность, extraovarian, inadequate study → O-RADS 0/N/A без LLM.
3. **Lexicon UI** — подсветка `lexiconFeatures` + bbox (когда worker отдаёт).
4. **Правила как data** — экспорт decision tables в версионируемый JSON + diff в CI.
5. **Golden set** — 30+ кейсов/система, двойное чтение; κ, sensitivity O-RADS 4–5 / BI-RADS 4+.
6. **OCR de-ID** — burned-in text mask перед внешним API.
7. **Telemetry** — `IMAGING_CDS_HINT_TELEMETRY`, расхождения hint vs врач (без PHI).
8. **SaMD** — ответы на чеклист РЗН / MDR / FDA (юрист + RA).
9. **Регресс-gate** — `imaging-cds-eval.mjs` в CI после появления manifest.
10. **Retire legacy** — отключить прямой category в старых worker deployments после golden win.

## 5. Клинический риск (приоритет)

1. **Высокий:** категория с фото без подтверждения → смягчено sanitize + UI wizard.
2. **Высокий:** устаревшие таблицы → тесты orads/birads + STEP0 мониторинг версий.
3. **Средний:** плохое фото экрана → QC warn; strict mode блокирует.
4. **Средний:** PHI в кадре → EXIF strip; burned-in **открыто**.
5. **Низкий:** расхождение O-RADS vs IOTA → уже показываем оба.

## 6. Env (CDS v2)

| Переменная | По умолчанию | Смысл |
|------------|--------------|--------|
| `IMAGING_CDS_V2` | on (кроме `0`) | QC + de-ID + sanitize |
| `IMAGING_CDS_STRICT_QC` | off | 422 при block-level QC |
| `IMAGING_CDS_HINT_TELEMETRY` | off | будущая аналитика расхождений |

См. также `ARCHITECTURE.md`, `MODEL-CARD-US-AI-WORKER.md`, `REGULATORY-CHECKLIST-RU.md`.
