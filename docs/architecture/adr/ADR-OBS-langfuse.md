# ADR-OBS — Observability: Langfuse (not Phoenix+Langfuse)

**Status:** Accepted · 2026-11-04  
**Context:** Wave 1 needs Evidence traces.

## Decision

- Primary: **Langfuse** (MIT core; optional Cloud).
- Implementation W1: HTTP ingestion no-op without keys (`evidence-trace.ts`).
- **Phoenix** not installed (ELv2; overlap). Revisit only if Langfuse blocked.

## Consequences

- Set `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` on staging to enable.
