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
| `/` | TBD | TBD | TBD | — | LH smoke `home` |
| `/login` | TBD | TBD | TBD | — | LH smoke `login` |
| `/tools/calc/rads/o-rads` | TBD | TBD | TBD | — | LH smoke `orads` |

## Known heavy areas

- TipTap editor bundle — consider dynamic import (already client component)
- DICOM viewer / 3D — lazy load
- Realtime subscriptions — cleanup in `use-case-discussion-realtime.ts`
- Clinical shell: GlobalSearch + VoiceDock deferred after idle/gesture (Wave C)

## Next steps

1. Run Lighthouse locally and fill table (`pnpm --filter @repo/web test:lighthouse`)
2. Add preview URL baseline in CI artifact (non-blocking)
3. Track bundle size: `pnpm --filter @repo/web analyze` (`ANALYZE=true`, `@next/bundle-analyzer`)
4. Prod RUM: Vercel Speed Insights (wired in root layout)
