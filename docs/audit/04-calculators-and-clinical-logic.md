# Calculators, Classifications & Clinical Logic

**Дата:** 2026-10-17

---

## 1. Source of truth

| Layer | Path | Role |
|-------|------|------|
| Catalog / routing | `packages/clinical-tools/src/modules.catalog.ts` | Maps modules → legacy tool IDs, education |
| Primary nav | `packages/clinical-tools/src/primary-nav.ts` | 5 tabs |
| Shared math | `packages/medical-calculations` | Cross-cutting formulas |
| Domain packages | see §2 | Per-specialty logic |

**Rule audit:** формулы **не изменялись**; сравнение с гайдлайнами — по наличию тестов и версий в пакетах, не клиническая экспертиза в runtime.

---

## 2. Domain packages (inventory)

| Domain | Package(s) | Web entry (examples) | Mobile | Tests (audit) |
|--------|------------|----------------------|--------|---------------|
| O-RADS US | `@repo/orads-us` | `/calculators/o-rads`, `/tools/calc/rads/o-rads` | stack screens | **42/42 pass** |
| BI-RADS US | `@repo/birads-us`, `@repo/breast-classification` | `/tools/calc/rads/bi-rads`, `/calculators/*` | yes | package-level (not all run) |
| TI-RADS | `@repo/tirads-acr`, `@repo/thyroid-tirads` | `/calculators/ti-rads`, adjunct tools | yes | **duplication P2** |
| FMF / screening | `@repo/fmf` | `/assistant/fmf`, calc OB | yes | not run in audit |
| Obstetric engine | `@repo/obstetric-engine` | `/calculators/ob`, `/tools/calc/ob` | partial | root scripts `test:fetal-biometry` etc. |
| CPI | `@repo/cervical-pathology-intelligence` | cervical intelligence routes | CPI stack | CI `pnpm test:cpi` |
| LN-RADS | `@repo/ln-rads-us` | `/calculators/ln-rads` | — | — |
| MUSA adenomyosis | `@repo/musa-framework` | `/musa/adenomyosis` | — | `test:musa-adenomyosis` script |
| IF CPC | `@repo/ifcpc-expert` | colposcopy calc | — | — |
| Vascular | `@repo/vascular-kulikov` | library vascular | — | — |
| Examination | `@repo/examination-engine` | appointment calc | — | — |

---

## 3. Catalog highlights (`modules.catalog.ts`)

Legacy `clinicalTools` IDs include (non-exhaustive): `orads-wizard`, `orads`, `birads`, `fmf`, `ob-calc`, `ga-lmp`, `ga-us`, `ga-ivf`, `ga-crl`, `ga-feto`, `cervical-length`, `assistant-gyn`, `assistant-obs`, `chat`, `new-case`, `telegram`.

**Status:** IMPLEMENTED_UNVERIFIED per tool — each maps to web route/component; mobile subset.

---

## 4. Validation & units

| Concern | Typical implementation | Status |
|---------|------------------------|--------|
| Input validation | Zod on API boundaries (web) | IMPLEMENTED_UNVERIFIED |
| Missing fields | per-calculator in packages | varies |
| Rounding | package-specific | not centrally audited |
| i18n / RU labels | `@repo/orads-us` locale tests | VERIFIED sample |

---

## 5. Duplication risks

| Pair | Issue | Recommendation |
|------|-------|----------------|
| `tirads-acr` vs `thyroid-tirads` | Two rule implementations | Deprecate one; redirect imports |
| `birads-us` vs `breast-classification` | Parallel UI/logic | Single export surface |
| Web `/calculators/*` vs `/tools/calc/*` | URL duplication | Canonical URLs + redirects |

---

## 6. AI vs deterministic calculators

- AI routes (`/api/ai/orads`, etc.) may **parallel** package logic — risk of **divergent results** (P1).
- **Recommendation:** AI should call shared `@repo/*` functions for numeric/category outputs where possible.

---

## 7. Tests executed in audit

```bash
pnpm --filter @repo/orads-us test          # 42 pass
pnpm --filter @repo/web test:security      # includes calculator bridge suite
```

**Not run:** full obstetric expert bundle, CPI package alone, every package `test` script.

---

## 8. Clinical correctness disclaimer

Audit confirms **code + tests exist** for O-RADS US core. **No audit claim** that all calculators match latest FIGO/O-RADS/ACR editions without per-package version tags and external validation.

---

## 9. Priority fixes

| ID | Pri | Task |
|----|-----|------|
| CALC-1 | P0 | If any calc returns wrong category vs package tests — fix immediately (none found in audit run) |
| CALC-2 | P1 | Wire AI assists to shared calculate functions |
| CALC-3 | P2 | Consolidate duplicate RADS packages |
| CALC-4 | P2 | Add CI matrix for `@repo/fmf`, `@repo/obstetric-engine` tests |
| CALC-5 | P3 | Document algorithm version in UI footer per tool |
