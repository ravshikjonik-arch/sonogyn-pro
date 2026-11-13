# Evidence Wave 1 (GO-W1) — внедрение

**Дата:** 2026-11-04  
**Статус:** реализовано в коде (soft eval + claims + Langfuse optional)

## Что сделано

| ID | Содержание | Где |
|----|------------|-----|
| PR-E1 | `claims` / `insufficient` на `AssistantAnswer`; rules + LLM normalize | `packages/evidence-retrieval` + `synthesize-llm.ts` |
| PR-E1 UI | Блок «Утверждения (claims)» | `EvidenceAssistantWorkspace.tsx` |
| PR-E2 | 15 golden prompts + structural runner | `packages/evidence-retrieval/eval/` |
| PR-E2 soft Promptfoo | `promptfooconfig.yaml` (echo; live opt-in) | same package |
| PR-E3 | Ragas scaffold | `services/evidence-eval/` |
| PR-E4 | Langfuse HTTP trace (no SDK) | `apps/web/lib/evidence/evidence-trace.ts` |

## Проверка

```bash
pnpm test:evidence-retrieval
pnpm eval:evidence-ragas:soft
pnpm --filter @repo/web typecheck   # при необходимости
```

Langfuse: задать `LANGFUSE_PUBLIC_KEY` + `LANGFUSE_SECRET_KEY` на staging/prod — иначе no-op.

## GO-W1+K1 (сделано)

| Item | Path |
|------|------|
| Soft chunker (CI) | `services/docling-ingest/spike_markdown_chunker.py` |
| Opt-in Docling | `run_docling_spike.py` + `requirements-docling.txt` |
| ADR-VEC | pgvector first — `docs/architecture/adr/ADR-VEC-pgvector-first.md` |

## GO-FULL-RESEARCH (ADR only, без install)

`docs/architecture/adr/ADR-OBS-langfuse.md`, `ADR-ORCH-…`, `ADR-INF-…`, `ADR-CORE-…`

## GO-K3 (сделано)

Hybrid vault + adapters: `docs/ai/evidence-wave-k3-hybrid.md`  
(`medical_vault` boost + soft A/B eval). Local smoke: vault hit на endometrioma fixture.

## GO-K4 (сделано)

Decision memo: **stay pgvector**, defer Qdrant.  
`docs/architecture/adr/ADR-VEC-k4-pgvector-vs-qdrant.md` · `docs/ai/evidence-wave-k4-decision.md`

## HOLD

Дальнейшие installs (полный Docling pip, Qdrant, LiteLLM, Haystack, OHIF, vLLM) — **только по новому явному GO**. Prod `EVIDENCE_MEDICAL_VAULT` / secrets deploy — отдельно.
