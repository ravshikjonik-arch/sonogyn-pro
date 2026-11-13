# Матрица источников: Excel ↔ SonoGyn Pro

Актуализация плана `sonogyn_sources_plan` (Excel «все Не начато» устарел).

Персона: **врач-практик** (карточка ≤10 с); вторично студент/ординатор.

Единый вход UI: [`/tools/refs/evidence-sources`](../../apps/web/app/(clinical)/tools/refs/evidence-sources/page.tsx).

## Источники

| Источник | Excel этап | Статус SonoGyn | Где |
|---|---|---|---|
| PubMed | 1 | **Live** | `packages/evidence-retrieval` → `pubmed` |
| ClinicalTrials.gov | 2 | **Live** | `clinical_trials` |
| Europe PMC | 2 | **Live** | `europe_pmc` |
| Cochrane (ссылки) | 1 | **Live (косвенно)** | `cochrane` via Europe PMC |
| КР МЗ РФ | 1 | **Live** | `kr_mz_rf` + `/tools/refs/guidelines` |
| Semantic Scholar | — | **Live (сверх плана)** | `semantic_scholar` |
| SonoEvidence corpus | — | **Live** | `static_corpus` + `/tools/refs/evidence` |
| OpenFDA / DailyMed | — | **Live (не РФ)** | `openfda`, `dailymed` |
| WHO / NICE / EMA | — | **Live (seed)** | `who`, `nice`, `ema` |
| ГРЛС | 1 | **Live (метаданные + ссылка)** | `grls` |
| OpenAlex | 2 | **Live** | `openalex` |
| DOAJ | 2 | **Live** | `doaj` |
| Epistemonikos | 3 | **Live (поиск + ссылка)** | `epistemonikos` |
| Росздравнадзор | 3 | **Live (лента + ссылка)** | `roszdravnadzor` |
| Trip / eLIBRARY / Scopus / WoS | 4 / только ссылки | **Outbound по DOI/названию** | `buildOutboundSourceLinks` |
| Лента «Новое» | 3 | **Live (hub вкладка)** | `/tools/refs/evidence-sources?tab=news` |

## Модули Excel → UI

| Модуль | Вкладка hub |
|---|---|
| 1. КР РФ | `kr` |
| 2. Evidence-поиск | `ask` |
| 3. Препараты | `drugs` |
| 4. Новое | `news` |
| 5. Ссылки вовне | `outbound` |

## Принципы (соблюдаем)

1. Ссылка и метаданные; полные платные тексты не храним.
2. У тезиса есть источник; РФ и международные — рядом.
3. ИИ только по найденным документам (`evidence` mode).
4. Тема: акушерство / гинекология / УЗИ.
5. Скорость ответа важнее полноты базы.
