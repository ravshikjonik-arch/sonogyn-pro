# IOTA probability models (`@repo/iota-models`)

Deterministic calculators aligned with published IOTA work — **assistive only**, not a histologic diagnosis.

## Models

| Model | Source (see `packages/iota-models/data/sources.json`) |
|-------|--------------------------------------------------------|
| **ADNEX** | BMJ 2014 / Evidencio IFU v2.0 shrinkage-adjusted coefficients |
| **LR2** | JCO 2005 logistic regression |
| **Simple Rules Risk** | AJOG 2016 Table 8 (updated cohort) |
| **Simple Rules (qualitative)** | Same B/M feature sets as `@repo/adnex-education` |

## O-RADS US comparison

`compareIotaRiskWithOrads` uses a **10% malignancy threshold** (`IOTA_ORADS_RISK_THRESHOLD`) to flag concordance vs discordance with O-RADS US categories 1–5. O-RADS logic lives in `@repo/orads-us` — this package only reads category numbers for comparison.

## Web UI

- Route: `/tools/calc/rads/iota`
- Structured adnex protocol: `/reports/adnex` → **Калькулятор IOTA / ADNEX** (session bridge, no PHI in storage keys beyond morphometry already in SRE).

## Mobile (Expo)

- Stack: `IotaCalculator` (`/iota` deep link)
- Tools search: **IOTA · ADNEX / LR2** → native screen (`@repo/iota-models`)
- O-RADS Pro → **ADNEX / LR2 (вероятности IOTA)** with prefill

## Tests

```bash
pnpm test:iota
pnpm test:orads-us
```

## SRE impression line

When morphometry is sufficient, `@repo/report-engine` appends an ADNEX malignancy line to the adnex impression block (`formatAdnexModelLine`).
