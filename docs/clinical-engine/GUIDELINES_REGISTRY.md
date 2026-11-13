# Реестр клинических рекомендаций и алгоритмов

**Статус:** проект на утверждение. Новых таблиц не создаётся.
**Хранилище:** Supabase `sources` + `canonical_calculator_registry` (+ `canonical_calculator_versions`, `canonical_calculator_sources`), RLS включён (миграция `20260824180000_medical_source_vault.sql`). Файловый реестр версий правил — `docs/clinical-imaging-cds/RULES-VERSIONS.json` (сводится с этим реестром).

## 1. Поля записи

| Поле | Где хранится сейчас | Действие |
|---|---|---|
| название, организация, страна/регион | `sources.title / organization` | регион — добавить |
| версия, дата публикации | `sources.version / published_at`, `canonical_calculator_versions` | — |
| дата последнего обновления | `canonical_calculator_versions.effective_from` | — |
| **дата следующей проверки** | нет | добавить (миграция по согласованию) |
| официальная ссылка | `sources.external_url` | — |
| лицензия и условия использования | `sources.copyright_status`, `license_notes`, `quotation_allowed` | заполнить для каждой записи |
| **статус клинической проверки** | `review_status` (редакционный) | добавить клинический статус: `draft / expert_reviewed / approved / retired` |
| история изменений | `canonical_calculator_versions.changelog` | — |

В коде движка — неизменяемая `GuidelineRef` с тем же `id` и `version`; тест сверяет код и реестр.

## 2. Начальные записи (на проверку)

| algorithmId | Документ | Организация | Версия | Лицензия / статус | Движок |
|---|---|---|---|---|---|
| `orads-us@2022` | O-RADS US Risk Stratification and Management System | ACR | v2022 | ⚠ коммерческое использование материалов и знака — запрос в ACR | `orads-us` |
| `iota-adnex@2014` | ADNEX model (Van Calster, BMJ 2014) | IOTA | 2014 | публикация; проверить условия IOTA | `iota-models` |
| `iota-lr2@2005` | LR2 (Timmerman, JCO 2005) | IOTA | 2005 | публикация | `iota-models` |
| `iota-srrisk@2016` | Simple Rules Risk (Timmerman, AJOG 2016) | IOTA | 2016 | публикация | `iota-models` |
| `acr-tirads@2017` | ACR TI-RADS White Paper (Tessler, JACR 2017) | ACR | 2017 | ⚠ знак TI-RADS™ — как для O-RADS | `tirads-acr` |
| `ru-tirads@2023` | RU TI-RADS | рос. авторы | 2023 | уточнить первоисточник | `thyroid-tirads` |
| `birads-us@local` | локальный ruleset BI-RADS US | SonoGyn (на основе ACR BI-RADS 5th ed.) | local | ⚠ BI-RADS® — зарегистрированный знак; маркировать как упрощённый | `birads-us` |
| `figo-palm-coein@2018` | FIGO PALM-COEIN / субклассификация миом | FIGO | 2018 | проверить | (перенос в пакет) |
| `musa@2022` | MUSA consensus (Van den Bosch, 2022) | MUSA group | 2022 | балльная шкала — собственная, маркировать | `musa-framework` |
| `fmf-t1@…` | кривые FMF-совместимые | FMF / собственные | — | не идентично FMF calculator — маркировать | `fmf` |
| `hadlock-efw@1985` | Hadlock IV | публикация | 1985 | публикация | `medical-calculations` |
| `bishop@1964` | Bishop score | публикация | 1964 | публикация | `medical-calculations` |
| `vbac-…` | модель VBAC | — | — | ⚠ текущая модель не MFMU — уточнить | `medical-calculations` |
| `ln-rads@local` | LN-RADS (внутренняя синтезированная шкала) | SonoGyn | local | **не официальная система** | `ln-rads-us` |
| КР / приказы МЗ РФ | `docs/clinical-standards-ru/00_Реестр_источников…` | МЗ РФ | — | открытые | `clinical-guidelines` |

## 3. Правила

1. Разные версии — разные записи и разные `algorithmId`; переключение версии — отдельный PR с тестами соответствия.
2. Запись без заполненной лицензии не может получить клинический статус `approved`.
3. Внутренние шкалы (LN-RADS, MUSA-балл) помечаются в UI «внутренняя шкала SonoGyn, не международный стандарт».
4. Дата следующей проверки — не реже 1 раза в 12 месяцев; просроченные — в отчёт модераторам.
