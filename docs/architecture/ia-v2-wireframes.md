# IA v2 — wireframes (кратко)

См. также: `modules-migration-map.csv`, migrations `20260701120000_*`, `20260703120000_*`.

## Реестр решений (актуально)

| ID | Решение | Статус |
|----|---------|--------|
| R1 | P0.5 Global Search (Tools + AI + Cases + Classifications) | ✅ |
| R2 | AI tab снят; discoverability через ⌘K (TD-NAV-AI-TAB закрыт) | ✅ |
| R3 | Academy = `tools/refs/*`, без `/academy` | ✅ |
| R4 | TI-RADS → `tools/adjunct/ti-rads` | ✅ |
| R5 | Legacy media audit + RPC `waive_legacy_case_media` | ✅ |
| R6 | Public media thumb / publish gate | ✅ |

## Shell (P0)

- Header: menu (mobile) · **Global Search ⌘K** · profile
- Bottom nav (mobile): **Лента · Кейсы · Инструменты · Профиль** (4 tab)
- AI — только через Search и sidebar (`/ai/consultants`, `/ai/workspace`)

## `/cases` (default home)

- Фильтры: библиотека / обсуждения / каналы / **Подтверждённые** (`?lifecycle=confirmed`)
- Карточки **без media thumb** до `anonymization_status ∈ {passed, waived}` (gate R6)
- Badges: lifecycle (OPEN…CONFIRMED), O-RADS, комментарии

## `/cases/new`

- Wizard 4 шага: контекст → описание → media hint → **анонимизация**
- Publish blocked без Step 4 checklist (+ server trigger R6)

## `/feed`

- Case of day · Confirmed · Rare · quick start cards (cold-start)

## Search (P0.5)

- Группы: Инструменты · AI · Кейсы · Классификации
- Default shortcuts: подтверждённые кейсы, новый кейс
- Legacy redirects: `/assistant`→`/ai/consultants`, `/workspace`→`/ai/workspace`, `/calculators/*`→`/tools/calc/*`, `/guidelines`→`/tools/refs/guidelines`

## Profile (P2)

- `/profile/patients`, `/profile/dashboard`, `/profile/pro`
- Legacy `/patients`, `/dashboard`, `/paywall` → redirect
