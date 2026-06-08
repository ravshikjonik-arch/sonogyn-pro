# Changelog

## 1.1.0 - 2026-04-30

### Added

- New `O-RADS Pro` single-screen calculator module (clinical fast-flow UI).
- Deterministic local O-RADS rule engine with override rules and local report export.
- Offline AI queue with retry/backoff, queue status, last error and source tracking.
- O-RADS case history:
  - list screen,
  - detail screen,
  - filters (category, 7 days, high-risk, critical),
  - sorting (newest/risk).
- Case reuse from history (`use as template`, `duplicate as new`).
- Local UX metric tracking (`TTFR`, average time-to-first-result).
- Release docs:
  - `src/features/oradsPro/RELEASE_QA_CHECKLIST.md`
  - `src/features/oradsPro/CLINICAL_AUDIT_NOTE.md`

### Changed

- Feed O-RADS widget opens `ORADSPro` route (single-screen workflow).
- Navigation stack extended with O-RADS history routes.
- App version bumped to `1.1.0` (`ios buildNumber=2`, `android versionCode=2`).

### Safety/Quality

- O-RADS logic unit tests added and passing (`oradsCalculator.test.ts`).
- BI-RADS regression section explicitly included in release QA checklist.
