# ADR-ORCH — Keep @repo/evidence-retrieval

**Status:** Accepted · 2026-11-04

## Decision

- Do **not** add LangChain / LlamaIndex / Haystack now.
- Extend `searchEvidenceUnified` + claims MVP.
- Haystack/Pydantic AI only after explicit gap analysis post-Docling+vector.

## Consequences

- Orchestration stays TypeScript in monorepo packages.
