# IOTA 2026 Consensus Integration Note

Source:

- Updated Consensus Opinion on the terms, definitions and measurements to describe the sonographic features of adnexal tumors from the International Ovarian Tumor Analysis (IOTA) Group
- Published: 2026-04-08
- DOI: 10.1002/uog.70191
- URL: https://obgyn.onlinelibrary.wiley.com/doi/10.1002/uog.70191

Implementation scope:

- The app stores a structured clinical decision-support summary, not the full copyrighted consensus text.
- Public ISUOG metadata states that the document summarizes terms, definitions and measurements required for IOTA modified benign descriptors, ADNEX model and two-step strategy.
- The current module maps existing O-RADS Pro inputs into:
  - modified benign descriptor readiness
  - ADNEX-style variable completeness
  - two-step triage route
  - harmonized O-RADS + IOTA 2026 summary

Production limitation:

- Before clinical release, the exact definitions and thresholds must be checked against the official full consensus document and locally validated.
