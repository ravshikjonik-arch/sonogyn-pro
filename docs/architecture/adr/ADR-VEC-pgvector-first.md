# ADR-VEC — Vector store: pgvector first

**Status:** Accepted (research) · 2026-11-04  
**Context:** Wave K1 Docling → chunks; need hybrid Medical RAG later.

## Decision

1. Use existing Supabase **pgvector** (`source_chunks.embedding`) as default.
2. Introduce **Qdrant** only after measured failure (latency, filter scale, ops).
3. No dual-write.

## Consequences

- Embed + HNSW migration is a separate GO.
- Qdrant remains DEFER in OSS audit.

## Implemented (2026-11-04, code only — prod apply separate)

| Artifact | Path |
|----------|------|
| Migration HNSW + `match_medical_vault_chunks` | `packages/database/supabase/migrations/20261104140000_medical_vault_pgvector.sql` (+ web mirror) |
| Adapter `medical_vault` | `packages/evidence-retrieval/src/adapters/medical-vault.adapter.ts` |
| Web search + embed query | `apps/web/lib/evidence/medical-vault-search.ts` (flag `EVIDENCE_MEDICAL_VAULT=1`) |
| Embed job | `apps/web/scripts/embed-medical-vault-chunks.mjs` |

**Prod:** do not enable flag until migration applied + at least one embedded published chunk.

**K4 (2026-11-04):** stay pgvector — see `ADR-VEC-k4-pgvector-vs-qdrant.md`.
