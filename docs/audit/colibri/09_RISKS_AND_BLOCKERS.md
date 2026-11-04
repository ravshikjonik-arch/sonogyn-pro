# 09 — Risks & Blockers

| ID | Severity | Описание | Статус | Блокер для |
|----|----------|----------|--------|------------|
| R1 | P0 | Chat failover пропускает только 429/502/503/504; Colibri down → 500 без cloud | RISK VERIFIED | Local AI UX с Colibri-first |
| R2 | P1 | Нет health-skip; возможен 180s hang на «полуживом» local | RISK | Latency / Vercel timeout |
| R3 | P1 | Double LLM Evidence chat | RISK cost | Unit economics |
| R4 | P1 | Incomplete model download; sidecar down | VERIFIED | Colibri inference |
| R5 | P2 | Routes bypass gateway (orads/tutor/vision) | PARTIALLY (enterprise) | Unified metering |
| R6 | P2 | PHI heuristic incomplete | RISK residual | Compliance |
| R7 | P2 | `cost.ts` rates ≠ real billing | PARTIALLY | Finance planning |
| R8 | Info | Vercel COLIBRI env unknown (403) | NOT VERIFIED | Prod confidence |
| R9 | Cost | VK GPU / 16-32 Ice Lake дорого | Business | Self-host delay |
| R10 | P2 | Duplicate `* 2.ts` files in tree | Hygiene | Confusion |

## Blockers to “Colibri production”

1. Working GPU/CPU host with full model.  
2. Hardened network + auth.  
3. Failover + health skip merged.  
4. Explicit prod env policy.

**Not a blocker for SonoGyn cloud product:** OpenRouter path (при корректном env без broken Colibri-first на chat).
