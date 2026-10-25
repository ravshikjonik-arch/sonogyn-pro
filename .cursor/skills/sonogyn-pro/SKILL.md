---
name: sonogyn-pro
description: >-
  SonoGyn Pro monorepo — clinical platform for OB/GYN and ultrasound physicians
  (Russia/CIS). Use for any feature, calculator (O-RADS, BI-RADS, IOTA, FIGO),
  web/mobile parity, refero-style UI, Supabase, a11y, clinical copy, and
  architecture in apps/web, apps/mobile, packages/*. Triggers on SonoGyn,
  sonogyn, калькулятор, протокол УЗИ, O-RADS US v2022, unified orads.
---

# SonoGyn Pro — project skill

Краткий контекст репозитория для агента. Полные правила: `.cursor/rules/`, `about-me.md`, `ai-style.md`, `CLAUDE.md`, `AGENTS.md`.

## Аудитория продукта

- **Пользователи:** врачи, ординаторы, студенты — **не пациенты**.
- **Персоны разработки:** врач-практик | студент/ординатор | самопроверка/экзамены. Не смешивать с RBAC `admin`.
- **Язык UI:** русский; классификации — O-RADS, BI-RADS, TI-RADS, IOTA, FIGO, FMF по гайдлайнам и КР РФ.
- **Дисклеймер на результатах:** не диагноз; интерпретация — лечащий специалист.

## Monorepo (куда класть логику)

| Область | Путь |
|--------|------|
| Web (Next.js) | `apps/web` |
| Mobile (Expo) | `apps/mobile` |
| O-RADS US engine | `packages/orads-us` — **единый источник истины** для расчётов |
| UI kit / tokens | `packages/ui`, CSS variables `--clinical-*` |
| БД | `packages/database` — миграции только по явному запросу |

**Жёстко:** бизнес-логика калькуляторов — в `packages/*`, не дублировать в web/mobile. Zod на API, RLS на новых таблицах Supabase.

## O-RADS US v2022 (unified)

- Оценка: `evaluateOradsUs2022` из `@repo/orads-us/pro`.
- Web UI: `apps/web/components/calculators/orads/OradsUnifiedCalculator.tsx`, маршрут `/tools/calc/rads/o-rads`.
- Mobile UI: `apps/mobile/src/features/oradsPro/screens/OradsUnifiedScreen.tsx`.
- **Не менять** legacy `calculateORADS` / десктопный pro-flow без явного запроса.
- Поле `cycleRegularity` — для протокола/UI; **не** вход stratification v2022.
- E2E: `[data-e2e-orads-unified]`, `[data-e2e-orads-category='N']`.

## UI / UX

- **Parity:** значимые изменения калькуляторов — web **и** mobile.
- **Дизайн:** tokens, light/dark (`a11y-dark-light` rule). Refero-style: редактор слева, live preview справа (`OradsUnifiedProtocolPreview`, `OradsReferoSection`).
- **Redesign:** при «красиво / refero / дизайн» — personal skill `frontend-design`.
- **Clinical UI / CDSS / disclaimers:** project skill `clinical-ui-safety` (`.cursor/skills/clinical-ui-safety/`).

## Работа с Равшаном (фаундер)

- Русский, **пошагово** для git/терминала/deploy; без базовой медицины.
- Без явного запроса: не коммитить, не пушить, не деплоить, не destructive Supabase MCP.
- Крупные фичи: pipeline architect (analysis → proposal → **одобрение** → plan → code) — см. `sonogyn_architect.mdc`.
- Мелкие правки по прямой формулировке («исправь», «сделай») — можно код сразу, минимальный diff.

## Проверка после изменений

```bash
pnpm install:deps   # при необходимости
pnpm typecheck
pnpm --filter @repo/web test:e2e:orads-pro-grid-smoke  # если трогали O-RADS web
```

Краткий отчёт: что изменено → команды → ручной smoke → риски.

## Связанные skills (личные, не в git)

Устанавливаются в `~/.cursor/skills/` — см. `references/install-skills.md`.
