# Acceptance Criteria — Priority Blocks

**Дата:** 2026-10-17  
Each block is **done** when all criteria pass.

---

## Block A: Migration integrity (P0)

| # | Criterion | Verification |
|---|-----------|--------------|
| A1 | One declared source of truth for SQL migrations | ADR in `docs/architecture/` |
| A2 | CI job fails if web vs database file sets differ | Script in CI |
| A3 | Staging DB passes `db:verify-hardening` | Run script against staging env |
| A4 | Prod verify documented with date + operator | Run log (no secrets) |

---

## Block B: EMR / teaching boundary (P0)

| # | Criterion | Verification |
|---|-----------|--------------|
| B1 | Written product scope: which roles see patients vs cases only | Product doc |
| B2 | Automated tests: user A cannot read user B patient | New security test file |
| B3 | Teaching case publish flow rejects raw PHI patterns | Extend phi-detection tests |
| B4 | OpenAPI or internal doc lists EMR endpoints separately | `docs/audit` appendix |

---

## Block C: AI evidence (P1)

| # | Criterion | Verification |
|---|-----------|--------------|
| C1 | Chat UI renders ≥1 source link when evidence mode on and hits exist | Manual + screenshot test case |
| C2 | Insufficient evidence shows fixed template, not hallucinated guideline | Golden prompt #5 in `03-ai-and-knowledge.md` |
| C3 | Prompt injection golden prompts blocked | Unit tests extended |
| C4 | `logEvidenceQuery` receives query id traceable in admin (no PHI in log) | Log sample review |

---

## Block D: Mobile parity — cases (P1)

| # | Criterion | Verification |
|---|-----------|--------------|
| D1 | Case detail shows `lifecycle_status` label RU | Mobile screen |
| D2 | Lifecycle history read-only list | API `.../lifecycle/history` |
| D3 | No structured edit on mobile (explicit message) | UX copy |
| D4 | Android preview APK installs and loads cases against prod API | Device smoke |

---

## Block E: iOS distribution (P1)

| # | Criterion | Verification |
|---|-----------|--------------|
| E1 | ≥1 device registered in EAS | `eas device:list` |
| E2 | `CFBundleVersion` matches `app.json` buildNumber | plist diff |
| E3 | `eas build -p ios --profile preview` completes | Expo dashboard artifact |
| E4 | App launches on device; auth + O-RADS smoke | Checklist |

---

## Block F: Monorepo health (P2)

| # | Criterion | Verification |
|---|-----------|--------------|
| F1 | `pnpm --filter @repo/mobile typecheck` exit 0 | Local + CI if added |
| F2 | `pnpm typecheck` after `prisma generate` exit 0 | CI already; document for devs |
| F3 | `@repo/ui` typecheck exit 0 locally | Fix `react 2` types issue |
| F4 | EAS Android upload size reduced ≥30% | Compare build logs |

---

## Block G: Calculator integrity (P0/P1)

| # | Criterion | Verification |
|---|-----------|--------------|
| G1 | `@repo/orads-us test` 100% pass on main | CI or dedicated job |
| G2 | CPI tests pass | `pnpm test:cpi` |
| G3 | AI ORADS route uses same core function as UI wizard | Code review + integration test |
| G4 | Version string visible in O-RADS UI (`ORADS_US_VERSION`) | Screenshot |

---

## Block H: Security regression (ongoing)

| # | Criterion | Verification |
|---|-----------|--------------|
| H1 | `test:security` ≥110 tests pass | CI step |
| H2 | `test:e2e:security` pass with OPEN_ACCESS_FULL=false | CI e2e job |
| H3 | Upload validation package tests pass | CI step |
| H4 | No new API route without Zod schema | Lint rule or CODEOWNERS review |

---

## Sign-off template

| Role | Block | Date | OK |
|------|-------|------|-----|
| Architect | A, F | | |
| Security | B, H | | |
| Clinical lead | G, C | | |
| Mobile lead | D, E | | |
| Product | B, C | | |

**Disclaimer:** Acceptance of clinical content requires physician review outside this technical audit.
