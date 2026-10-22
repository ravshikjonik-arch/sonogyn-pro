# Шаг 0 — аудит модуля анализа снимков (SonoGyn Pro)

Дата: 2026-10-22. Статус: **STEP0 инженерно закрыт** (CDS v2 + golden synthetic + SaMD technical pack). **Юридический SaMD sign-off и pixel golden** — отдельный RA/клинический этап.

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
| Категория с vision | `orads`/`birads` на кадре, scorecard в текст | **Sanitize (web)** + **strip (worker orchestrator)** + промпты без категории |
| QC фото | только `image/*` | **runImagingQc** + optional `IMAGING_CDS_STRICT_QC` |
| De-ID | EXIF не на всех AI routes | **prepareImagingFramesForAnalysis** перед assist API |
| Правила в YAML | TS/JSON в пакетах | Реестр версий `RULES-VERSIONS.json`; полный YAML — backlog |
| Golden set / метрики | нет | **manifest.example.json**, `scripts/imaging-cds-eval.mjs` |
| SaMD docs | частично | `REGULATORY-CHECKLIST-RU.md`, `MODEL-CARD-US-AI-WORKER.md` |
| OCR burned-in PHI | не реализовано | **Band-mask** top/bottom + heuristic warn (не OCR-текст) |
| Applicability (ТМ, EP…) | в UI/текстах | **Gates** gyn/breast в assist API + UI сообщения |
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
2. ✅ **Applicability API (gyn + breast)** — gates в `/api/ai/gyn-assist` и `/api/ai/breast-assist`.
3. ✅ **Lexicon UI + bbox** — `LexiconFeaturesList` + `LexiconImageOverlay` (normalized region).
4. ✅ **Правила как data** — O-RADS tree + BI-RADS rules snapshots + verify scripts в CI.
5. ✅ **Golden set (CI)** — 34 synthetic feature cases + `manifest.synthetic-ci.json`, κ/high-risk в eval; **pixel + двойное чтение** — RA backlog.
6. ✅ **De-ID overlay mask** — EXIF + blur top/bottom bands (`IMAGING_CDS_MASK_BURNED_IN`, default on).
7. ✅ **Telemetry (скелет)** — `/api/ai/imaging-cds-telemetry`, `sendImagingCdsTelemetry` (флаг off по умолчанию).
8. ✅ **SaMD technical** — `SAMD-TECHNICAL-COMPLETION.md`; юридический sign-off — RA backlog.
9. ✅ **Регресс-gate (скелет)** — `imaging-cds-eval.mjs` в CI (exit 2 на пустом manifest → OK).
10. ✅ **Retire legacy (worker)** — `_cds_strip_legacy_categories` в orchestrator; opt-in `US_AI_WORKER_ALLOW_LEGACY_CATEGORIES=1`.

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
| `IMAGING_CDS_MASK_BURNED_IN` | on (кроме `0`) | blur верх/низ кадра перед worker |
| `US_AI_WORKER_ALLOW_LEGACY_CATEGORIES` | off | только dev: вернуть `orads`/`birads` на кадрах worker |

См. также `ARCHITECTURE.md`, `MODEL-CARD-US-AI-WORKER.md`, `REGULATORY-CHECKLIST-RU.md`.
