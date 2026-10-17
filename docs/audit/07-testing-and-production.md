# Testing, Build, CI & Production Readiness

**Дата:** 2026-10-17

---

## 1. CI pipeline (`.github/workflows/ci.yml`)

### Job `ci` (ubuntu, Node 22, pnpm 10.6.5)

| Step | Purpose |
|------|---------|
| `pnpm install --frozen-lockfile` | Repro deps |
| `prisma generate` (apps/web) | **Required for typecheck** |
| `pnpm typecheck` | Whole monorepo turbo |
| `pnpm lint` | ESLint turbo |
| `pnpm test:cpi` | Cervical pathology |
| `npm run test:security --prefix apps/web` | 110+ security unit tests |
| `test --prefix packages/upload-validation` | Upload validation |
| `turbo build --filter=@repo/web` | Production webpack build |

### Job `e2e` (needs ci)

- Playwright: CPI, auth, a11y smoke, security smoke (fixtures + DEV_SKIP_AUTH in job env).

### Main branch results (gh CLI)

| Run | Commit context | Result |
|-----|----------------|--------|
| 38743175038 | Android versionCode 7 | **success** |
| 38741780305 | PR #52 clinical platform merge | **success** |

### Broken workflow

| Workflow | Symptom |
|----------|---------|
| `us-ai-worker.yml` | **failure in 0s** on main push — config/secrets/path; does not block main `CI` job |

---

## 2. Local checks (this audit)

| Command | When | Result | Notes |
|---------|------|--------|-------|
| `pnpm --filter @repo/web test:security` | 2026-10-17 | **110 pass** | VERIFIED |
| `pnpm --filter @repo/orads-us test` | 2026-10-17 | **42 pass** | VERIFIED |
| `pnpm --filter @repo/evidence-retrieval test` | 2026-10-17 | **11 pass** | VERIFIED |
| `pnpm --filter @repo/web typecheck` | 2026-10-17 | **fail** | Missing `prisma generate`; achievements `any`; PrismaClient |
| `pnpm --filter @repo/mobile typecheck` | 2026-10-17 | **fail** | `apps/mobile/yakrav7700` path pollution |
| `turbo typecheck` partial | 2026-10-17 | fail `@repo/ui` | Cannot find type definition `react 2` (local env) |
| Full `pnpm test:e2e` | — | **not run** | Trust CI e2e job |
| Full `pnpm typecheck` | — | **not run clean** | Use CI as source of truth |
| Lighthouse | — | not run | script exists `test:lighthouse` |

---

## 3. Test coverage map

| Area | Unit | E2E | Gap |
|------|------|-----|-----|
| Security / Zod | ✅ | security smoke | — |
| Case lifecycle | ✅ | partial | Full lifecycle e2e |
| Protocol lifecycle | ✅ unit | — | DB finalize lock |
| AI hardening | ✅ | — | Medical eval |
| Calculators | O-RADS ✅ | CPI e2e | Other calcs |
| Auth | stubs | auth.spec | Prod IdP |
| a11y | — | soft smoke | strict optional |
| Mobile | — | — | **MISSING** Detox/Maestro |

---

## 4. Production readiness checklist

| Gate | Status | Evidence |
|------|--------|----------|
| Web builds in CI | ✅ VERIFIED | turbo build green |
| Env vars on Vercel | BLOCKED | not inspected (no token dump) |
| Supabase migrations applied prod | PARTIAL | verify script passed earlier; drift between trees |
| RLS hardened | PARTIAL | docs + migrations; EMR gap |
| AI cost controls | IMPLEMENTED_UNVERIFIED | cost-control.ts |
| Monitoring | PARTIAL | Sentry opt-in |
| Mobile store release | NOT READY | iOS creds; no Play review bundle |
| Dependabot PR | failure on deps bump | run 38749547954 — needs triage |

---

## 5. Blocking issues before «full» production

| ID | Issue | Pri |
|----|-------|-----|
| BR-1 | Migration mirror drift (60 vs 45) | P0 |
| BR-2 | EMR vs teaching security boundary | P0 |
| BR-3 | iOS distribution blocked | P1 (if iOS required) |
| BR-4 | AI citation quality not CI-gated | P1 |
| BR-5 | Mobile typecheck broken locally | P2 |
| BR-6 | us-ai-worker workflow broken | P2 |
| BR-7 | `@repo/video` missing but scripted | P3 |

---

## 6. Reproduce CI locally (safe)

```bash
pnpm install --frozen-lockfile
cd apps/web && pnpm exec prisma generate && cd ../..
pnpm typecheck
pnpm lint
pnpm test:cpi
pnpm --filter @repo/web test:security
pnpm exec turbo build --filter=@repo/web
cd apps/web && pnpm test:e2e:cpi && pnpm test:e2e:auth
```

Requires Playwright browsers for e2e.

---

## 7. Observability

- Sentry scrub tests — in security suite.
- `safeLog` — standard for new code.
- No centralized metrics dashboard audited — **MISSING** for product analytics.
