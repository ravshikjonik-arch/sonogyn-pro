# Release Candidate 1.1.0

## Scope

- O-RADS Pro single-screen clinical calculator
- Offline AI queue + retry/backoff
- History/details/template reuse
- UX TTFR metric
- BI-RADS regression guardrails

## Versioning

- `package.json`: `1.1.0`
- `app.json`:
  - `expo.version`: `1.1.0`
  - `ios.buildNumber`: `2`
  - `android.versionCode`: `2`

## Validation Artifacts

- Changelog: `CHANGELOG.md`
- Smoke protocol: `src/features/oradsPro/SMOKE_TEST_PROTOCOL.md`
- Clinical QA checklist: `src/features/oradsPro/RELEASE_QA_CHECKLIST.md`
- Clinical validation form: `src/features/oradsPro/CLINICAL_VALIDATION_FORM.md`
- Audit note: `src/features/oradsPro/CLINICAL_AUDIT_NOTE.md`

## Release Blockers

- Any failed scenario from BI-RADS regression section
- Any O-RADS category mismatch on high-risk/critical scenarios
- Any crash in offline queue flow or history detail/template routing
