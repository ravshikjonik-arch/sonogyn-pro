# ADR-CORE — SonoGyn clinical kernel is authoritative

**Status:** Accepted · 2026-11-04

## Decision

OSS tools **augment** but never replace:
- `packages/orads-us`, calculators, classifications
- Evidence adapters + vault + `medical_reviews`
- Expert review before publishing knowledge

Agents/LLM call calculators as tools; they do not redefine O-RADS/BI-RADS/FIGO.
