# Prioritized Roadmap

**Дата:** 2026-10-17  
**Приоритеты:** P0 critical → P3 enhancement  
**Размер:** S / M / L / XL

---

## P0 — Critical

| # | Task | Size | Deps | Acceptance |
|---|------|------|------|------------|
| 1 | **Sync migration trees** (web 60 vs database 45); CI diff fails on drift | M | DBA | Single canonical dir; green diff job |
| 2 | **EMR vs teaching boundary** — product spec + RLS IDOR tests on `patients`, `studies` | L | legal/product | Test suite proves no cross-tenant read |
| 3 | **Staging migration apply** for 20260910* hardening if not on prod | M | Supabase staging | `db:verify-hardening` on staging then prod checklist |
| 4 | Calculator regression gate | S | — | O-RADS + CPI tests required on PR touching packages |

---

## P1 — High

| # | Task | Size | Deps | Acceptance |
|---|------|------|------|------------|
| 5 | **AI evidence citations** — UI always shows sources or explicit insufficient-evidence | M | evidence-retrieval | Golden-set 20 prompts in CI optional job |
| 6 | **Mobile case lifecycle** read-only view + sync types | M | `@repo/types` | Mobile displays lifecycle_status from API |
| 7 | **iOS preview device build** — register devices, fix Info.plist build # | S | Apple dev | `eas build -p ios --profile preview` success |
| 8 | **Consolidate AI assist endpoints** to shared calculator functions | L | packages | Same category from API and UI calc |
| 9 | **Medical knowledge registry** (version, locale, owner) | L | admin | One query lists all sources |
| 10 | **Fix us-ai-worker.yml** or disable until worker deployed | S | infra | Green or removed from required checks |

---

## P2 — Important

| # | Task | Size | Deps | Acceptance |
|---|------|------|------|------------|
| 11 | Exclude `apps/mobile/yakrav7700` from mobile tsconfig | S | — | `pnpm --filter @repo/mobile typecheck` pass |
| 12 | Dedupe TI-RADS / BI-RADS packages | L | tests | One import path; no behavior change |
| 13 | Canonical calculator URLs + redirects | M | SEO | One URL per tool in sitemap |
| 14 | Wire or delete orphan mobile screens | S | UX | No dead entry points |
| 15 | Shrink EAS upload via `.easignore` | S | — | Archive < 200 MB target |
| 16 | Protocol FINALIZED immutability (DB) | M | migration | E2E cannot edit finalized |
| 17 | `security_audit_log` server insert RPC | S | migration | Failed client inserts logged server-side |
| 18 | Mobile unified search (read-only web API) | L | search API | Mobile finds guidelines/nosology |
| 19 | Add obstetric/FMF tests to CI | M | — | Scripts in root package.json run in CI |
| 20 | Dependabot production-deps PR fix | M | — | CI green on bump branch |

---

## P3 — Enhancements

| # | Task | Size | Notes |
|---|------|------|-------|
| 21 | Restore `@repo/video` or remove scripts | M | Remotion marketing |
| 22 | Mobile courses offline cache | XL | education persona |
| 23 | Atlas expansion mobile | L | fetal spine parity |
| 24 | Strict a11y / lighthouse in CI | M | opt-in flag only per rules |
| 25 | Unified audit viewer UI | L | cross-domain audit events |

---

## Phased plan

### Phase A — Trust (4–6 weeks)

- P0 items 1–3  
- P1 items 5, 8 (start), 10  
- Deliverable: safe deploy process + AI citation MVP

### Phase B — Parity (6–10 weeks)

- P1 items 6, 7, 9  
- P2 items 11–18  
- Deliverable: mobile credible for cases + tools; web IA cleanup

### Phase C — Scale (ongoing)

- P3 + community/education depth  
- Vector RAG only if corpus growth requires

---

## Dependency graph (critical path)

```
Migration sync (P0-1)
    → Staging apply (P0-3)
    → EMR RLS tests (P0-2)
         → Production release sign-off

Evidence registry (P1-9)
    → AI citation CI (P1-5)

Package dedupe (P2-12)
    → AI/calc unify (P1-8)
```
