# Phase 1 Closeout — 2026-08-01

**Персоны:** врач-практик · студент (cases/gallery)

## Verdict

Phase 1 (SRE + O-RADS tree + IOTA triangulation + Cases search) **закрыта** без открытых блокеров в коде и на prod schema.

## T1.1–T1.14

| ID | Status | Notes |
|----|--------|-------|
| T1.1–T1.5 | ✅ | SRE types, engine, API, web workspace, mobile persist |
| T1.6–T1.8 | ✅ | `useOradsNavigator` · web + mobile wizards |
| T1.9 | ✅ | Web tabs + **mobile IOTA panel** |
| T1.10 | ✅ | Shared `mapOradsTreeToSreInput` in `@repo/report-engine` |
| T1.11 | ✅ | `cases.orads_category` / `tags` + RLS on prod; mirrored in `packages/database` |
| T1.12–T1.13 | ✅ | GET filters + web UI; expert queue = toast stub |
| T1.14 | ✅ | Mobile gallery + **O-RADS/tags filters** |

## Closeout fixes (this pass)

1. Unified tree→SRE mapper (+ triangulation) in `@repo/report-engine`
2. Mobile wizard tab «IOTA × O-RADS»
3. Mobile cases O-RADS/tags filter UI
4. Zod validate wizard→SRE sessionStorage bridge
5. POST `/api/cases` accepts optional `orads_category` / `tags`
6. Migration mirror `packages/database/.../20260801130000_cases_orads_tags.sql`

## Intentional dual path (not a hole)

| Path | SoT |
|------|-----|
| Wizard / tree | `@repo/orads-us` decision tree + navigator |
| Pro chips / text | `@repo/orads-us/pro` `calculateORADS` |

Оба packageized; Pro — расширенная форма, не legacy-дубль дерева.

## Prod checks

- Columns `cases.orads_category`, `cases.tags` — present
- RLS `cases_select_policy` includes published public + moderator review
- `GET /api/cases` → **200** with browser UA (curl blocked by bot-detection — expected)
- Smoke: `BASE_URL=https://sonogyn-pro.ru node apps/web/scripts/phase1-closeout-smoke.mjs`
- Typecheck: `@repo/report-engine` ✅ · `@repo/mobile` ✅

## Known non-blockers

- `node --import tsx` unit tests for packages that import `@repo/medical-calculations` may fail named-export interop under tsx; **tsc --noEmit** is the gate.
- Expert queue remains toast stub until Phase 2.

## Out of Phase 1 (Phase 2+)

- Expert review approve/publish workflow (beyond toast stub)
- Education quiz extract (T2.x)
- Clinic B2B (T3.x)

## CDS

Все протоколы и IOTA-панели: «Не диагноз; интерпретация — специалист».
