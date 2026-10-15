# Performance Baseline

**Дата:** 2026-09-10  
**Статус:** initial capture pending CI run

## Tooling

- Lighthouse smoke: `pnpm --filter @repo/web test:lighthouse` (`scripts/lighthouse-smoke.mjs`)
- CI: soft by default (`LIGHTHOUSE_STRICT` not set)
- Turbo build cache enabled

## Target pages (CWV focus)

| Page | LCP target | INP target | CLS target |
|------|------------|------------|------------|
| Case feed | ≤ 2.5s | ≤ 200ms | ≤ 0.1 |
| Case detail | ≤ 2.5s | ≤ 200ms | ≤ 0.1 |
| AI copilot | ≤ 2.5s | ≤ 200ms | ≤ 0.1 |
| Calculators (O-RADS) | ≤ 2.5s | ≤ 200ms | ≤ 0.1 |
| Structured editor | ≤ 2.5s | ≤ 200ms | ≤ 0.1 |

## Baseline procedure

```bash
pnpm dev:web   # localhost:3000
pnpm --filter @repo/web test:lighthouse
```

Record results below after each release train.

## Baseline snapshot (placeholder)

| Route | LCP | INP | CLS | Date | Notes |
|-------|-----|-----|-----|------|-------|
| `/cases` | TBD | TBD | TBD | — | Run locally |
| `/cases/[id]` | TBD | TBD | TBD | — | |
| `/calculators/orads` | TBD | TBD | TBD | — | |

## Known heavy areas

- TipTap editor bundle — consider dynamic import (already client component)
- DICOM viewer / 3D — lazy load
- Realtime subscriptions — cleanup in `use-case-discussion-realtime.ts`

## Next steps

1. Run Lighthouse locally and fill table
2. Add preview URL baseline in CI artifact (non-blocking)
3. Track bundle size via `@next/bundle-analyzer` on demand
