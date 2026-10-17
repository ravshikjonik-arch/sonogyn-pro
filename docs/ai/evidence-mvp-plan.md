# Evidence AI MVP — plan (Block B, not implemented)

**Phase A · design only · 2026-10-17**

## Goal

Клинический ответ в **evidence mode** должен различать факты из источников и вывод модели; без источников — явное «недостаточно данных», не общий disclaimer.

## Current baseline (can support MVP without vector RAG)

| Piece | Location | Note |
|-------|----------|------|
| Unified retrieval | `@repo/evidence-retrieval` `searchEvidenceUnified` | Adapters + rank |
| Insufficient path | `evidence-insufficient.ts` | **No LLM** when no citations |
| Prompt rules | `evidence-context.ts` | Citations-only instructions |
| Chat wiring | `app/api/ai/chat/route.ts` `mode === "evidence"` | |

**Gap:** `clinical` mode + `EVIDENCE_CLINICAL_HINTS` может вызывать LLM без жёстких citations.

## MVP scope (after product GO)

1. **UI:** панель sources из `evidence.citations[]`; empty → шаблон insufficient (уже в API).
2. **API schema:** optional `claims: { text, kind: "sourced"|"inference", citationIndexes[] }[]` post-process or structured output.
3. **Metadata:** extend citation `{ title, org, year, locale, version?, url, snippet }`.
4. **Eval tests:** 15–20 golden prompts in `packages/evidence-retrieval` — assert citations.length ≥ 1 OR insufficient flag.
5. **Negative:** adapter timeout/error → insufficient, never synthetic PMID.
6. **Default policy:** evidence mode for «доказательные» вопросы; clinical mode labeled «без гарантии источников»; hints off by default in prod.

## Out of scope for MVP

- pgvector / full RAG pipeline unless corpus exceeds adapter coverage.
- Replacing specialty assist routes (separate P1).

## Acceptance

Block C in `docs/audit/09-acceptance-criteria.md`.
