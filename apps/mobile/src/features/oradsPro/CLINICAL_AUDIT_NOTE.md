# Clinical Audit Note (pre-pilot)

## Scope

- O-RADS Pro single-screen module
- Existing BI-RADS module regression

## O-RADS status

Current implementation is deterministic and local (offline-first), with override rules for ascites, solid component with flow, and postmenopausal size escalation.

### Known simplifications vs full O-RADS v2022 matrix

1. Rule coverage is practical and high-yield, not a full encyclopedic tree.
2. Some subtype edge cases are intentionally collapsed into grouped branches for speed.
3. "Atypical" benign-pattern promotion is implemented via proxy signs (solid component / flow), not full morphology ontology.

## BI-RADS status

BI-RADS module is maintained through dedicated ruleset (`rules.birads.json`) and evaluator (`guidelines/birads.ts`).
No direct code coupling from O-RADS Pro logic to BI-RADS logic was introduced.

## Release guardrails included

- Auto-save history with filters and details
- Template reuse from prior cases
- AI queue with retry/backoff + failure reason
- TTFR metric tracking for UX safety

## Recommendation before clinical pilot

1. Run `RELEASE_QA_CHECKLIST.md` end-to-end with a radiologist.
2. Perform side-by-side comparison on 30-50 historical O-RADS cases.
3. Capture discordant outcomes and encode as additional deterministic rules.
