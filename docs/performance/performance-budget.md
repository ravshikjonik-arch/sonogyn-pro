# Performance Budget

**Effective:** 2026-09-10 (soft — non-blocking CI)

## Core Web Vitals thresholds

| Metric | Budget | CI enforcement |
|--------|--------|----------------|
| LCP | ≤ 2.5s | Soft (warn) |
| INP | ≤ 200ms | Soft (warn) |
| CLS | ≤ 0.1 | Soft (warn) |

Enable strict mode: `LIGHTHOUSE_STRICT=1 pnpm --filter @repo/web test:lighthouse`

## Bundle budgets (guidance)

| Chunk | Target (gzip) | Action if exceeded |
|-------|---------------|-------------------|
| First load JS (case detail) | < 350 KB | dynamic import |
| TipTap editor | lazy on tab | already isolated |
| Calculator pages | < 200 KB incremental | code split |

## API budgets

| Endpoint | p95 target |
|----------|------------|
| `GET /api/cases` | < 500ms |
| `PATCH .../lifecycle` | < 800ms |
| Structured save | < 1s |

## Realtime

- Max 1 presence channel per case tab
- Unsubscribe on unmount (required in all hooks)

## Review cadence

- Update baseline after major features
- Promote to CI blocking only when baseline stable for 2 sprints
