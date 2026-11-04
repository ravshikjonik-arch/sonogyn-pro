# 08 — Implementation Roadmap

**Rule:** audit only produced docs; implementation requires explicit approval per item. No migrations/deploys implied by this file alone.

## Phase A — Immediate (1–2 weeks) · before growth marketing

| # | Item | Owner lens | Depends | Done when |
|---|------|------------|---------|-----------|
| A1 | Prod env: `NEXT_PUBLIC_OPEN_ACCESS_FULL=false` | Ops | — | Unauth AI 401 |
| A2 | Enable Auth leaked-password protection | Ops (Supabase dashboard) | — | Advisor clear |
| A3 | Confirm Upstash + SRK + no `AUTH_RATE_LIMIT_RELAXED` | Ops | — | `/api/health` green; guard |
| A4 | Migration draft: restore `profiles` roster SELECT | Security | Approval | Cross-user select fails |
| A5 | Triage SECURITY DEFINER: revoke anon execute on dangerous RPCs | Security/DB | Staging | Advisor count ↓ |
| A6 | Fail-closed monthly AI quota without SRK | AI | Code PR | Unit test |
| A7 | Edge Function auth review (`verify_jwt` / secrets) | Ops | — | Unauthorized 401 |

## Phase B — Scale to ~1 000 registered (2–6 weeks)

| # | Item | Done when |
|---|------|-----------|
| B1 | Route tutor/orads/messenger AI through Gateway | Grep clean for raw OpenRouter chat |
| B2 | SQL aggregate for doctor daily quota | Explain plan O(1) |
| B3 | Evidence adapter tiers + Redis hit SLO | p95 search budget |
| B4 | Redact/hash `evidence_query_log` | No raw PHI queries |
| B5 | Index top unindexed FKs (hot tables only) | Advisor subset ↓ |
| B6 | Staging Supabase (Pro branch or twin) | `list_branches` or second project |
| B7 | k6 staging suite (non-AI + mocked AI) | Report in `docs/performance/` |

## Phase C — Scale to ~10 000 (1–3 months)

| # | Item | Done when |
|---|------|-----------|
| C1 | US analyze `worker_queue` executor | Fail% ↓ under staging load |
| C2 | Worker ≥2 replicas + health | `/health` green multi-instance |
| C3 | RLS initplan cleanup on hottest tables | Advisor ↓ on those tables |
| C4 | Org-level AI quotas (design → schema) | B2B pilot |
| C5 | DR runbook + PITR verified | Tabletop exercise |
| C6 | Cost reconcile automation (weekly) | Alert if estimate vs invoice >30% |

## Phase D — Toward 100 000+ (quarter+)

| # | Item | Done when |
|---|------|-----------|
| D1 | Optional dedicated Gateway service | Non-Next consumers share metering |
| D2 | Private GPU/Colibri pool as first-class provider | Failover tested |
| D3 | Stage 4 RAG only if legal corpus + HNSW + eval harness | Retrieval quality gates |
| D4 | Multi-tenant clinic isolation | IDOR tests per org |
| D5 | Observability SLO pack (latency, AI $, error budget) | On-call dashboard |

## Explicit non-work (until requested)

- Migrating primary DB off Supabase.
- Buying bare-metal / installing Colibri as mandatory prod.
- Enabling `A11Y_STRICT` / `LIGHTHOUSE_STRICT` in CI.
- Applying SQL on prod without explicit OK.

## Suggested approval sequence

1. Ops env locks (A1–A3, A7) — no code.
2. Security migrations (A4–A5) — staging first.
3. AI hardening PRs (A6, B1–B4).
4. Scale engineering (C1+) when metrics trip.

## Verification pack (recurring)

```bash
pnpm typecheck
pnpm --filter @repo/web test:security
pnpm --filter @repo/web test:e2e:security
curl -s -H 'User-Agent: Mozilla/5.0' "$APP/api/health" | jq .
# Supabase MCP (read-only): get_advisors security + performance
```
