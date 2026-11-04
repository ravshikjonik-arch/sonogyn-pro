# 09 — Risks and Blockers

Consolidated register from phases 1–6. Each row is evidence-backed.

## P1 — Fix before aggressive growth

| ID | Area | Evidence | Problem | Consequence | Solution | Verify |
|----|------|----------|---------|-------------|----------|--------|
| SEC-P1-01 | Security | `20261022_verification_reputation.sql` L353–355 | Profiles SELECT all authenticated | Peer PII / license / billing ids leak | Restore roster RLS / badge view | Cross-user select denied |
| SEC-P1-02 | Security | `dev-account.ts` | Open-access default true | Abuse, AI spend, blurred auth | Prod env `false` | Unauth → 401 |
| SEC-P1-03 | Security | `rate-limit.ts` | `AUTH_RATE_LIMIT_RELAXED` not prod-blocked | Brute-force auth | Add production violation | Deploy fails if set |
| SEC-P1-04 | DB/Sec | Advisors ×65 DEFINER anon | Dangerous RPCs callable | Reputation/moderation abuse | Revoke EXECUTE; service_role only | Advisor ↓; RPC denied |
| SEC-P1-05 | Auth | Advisor HIBP | Leaked password protection off | Compromised passwords | Enable in dashboard | Advisor clear |
| SEC-P1-06 | Edge | MCP `verify_jwt: false` ×4 | Weak edge auth posture | Spam/push/reputation abuse | JWT or strict secret | Unauthorized fail |
| AI-P1-01 | AI | `cost-control.ts` | Quota bypass without SRK | Unlimited free LLM | Fail closed | Test without SRK |
| AI-P1-02 | AI | `doctor-quota.ts` | O(n) day event scan | Chat latency at volume | SQL aggregate | Explain plan |
| OPS-P1-01 | Ops | Vercel MCP empty teams | Cannot verify prod env via agent | Blind ops | SSO authorize Vercel MCP | `list_projects` works |
| SCALE-P1-01* | Scale | `analyze/route.ts` | `after()` non-durable | *P1 when concurrent AI vision rises* | Worker queue | Staging load fail% |

\*SCALE-P1-01 is **conditional** on vision adoption; today traffic low (`ai_analyses` = 1 row).

## P2 — Plan for 1k–10k

| ID | Area | Problem | Consequence | Solution | Verify |
|----|------|---------|-------------|----------|--------|
| AI-P2-01 | AI | Split LLM callers | No failover/meter | Unify Gateway | Grep clean |
| AI-P2-02 | Evidence | Adapter fan-out | Latency / bans | Tiers + cache | p95 |
| AI-P2-03 | Vision | `after()` jobs | Lost work | Queue Phase 2 | Fail% |
| AI-P2-04 | RAG | Vector unused | False capability | Stage 4 or defer | No ANN |
| AI-P2-05 | Privacy | Evidence query text logged | PHI retention | Hash/redact | Log sample |
| DB-P2-01 | DB | 78 unindexed FKs | Slow joins | Index hot paths | Advisor |
| DB-P2-02 | DB | 171 RLS initplan | CPU under EMR growth | `(select auth.uid())` | Advisor |
| DB-P2-03 | DB | 72 multi permissive policies | Planner cost | Merge | Advisor |
| DB-P2-04 | Ops | PITR undocumented | Unknown RPO | Runbook | Tabletop |
| SEC-P2-* | Security | Middleware gaps, XSS, mobile upload, audit RPC | Varied | See `04_SECURITY_AUDIT.md` | Suites |
| ARCH-P2-* | Arch | Dual migrations; no staging; video package | Drift / blast radius | SSOT + Pro branch | CI / branches |
| HYB-P2-* | Hybrid | Gateway incomplete; no DR doc | Lock-in / RTO | Docs + code | Reviews |
| COST-P2-* | Cost | Estimate ≠ invoice; fan-out | Budget surprise | Reconcile + cache | Alerts |
| SCALE-P2-02 | Scale | No staging for load tests | Blind scaling | Twin project | Branch |

## P3 — Hygiene

| ID | Problem | Solution |
|----|---------|----------|
| DB-P3-01 | 84 unused indexes (low traffic) | Revisit after baseline |
| DB-P3-02 | `user_metadata` RLS no policy | Explicit posture |
| SEC-P3-* | Shared open-access RL key; AsyncStorage web; retention text | Polish |
| AI-P3-01 | AI SDK skips Colibri | Document or wire |
| ARCH-P2-01 / P3 | Remotion package missing | Restore or drop script |
| SCALE-P3-01 | Performance baseline TBD | Fill baseline.md |
| COST-P3-01 | Colibri $0 hides GPU cost | Ops sheet |

## Blockers to 100 000+ (structural)

1. **No org/tenant model** for clinics — EMR is per-user only.
2. **No durable compute plane** for vision/batch (still Vercel `after()` + optional single worker URL).
3. **Evidence + LLM cost** unbounded without org budgets.
4. **Realtime + storage** will hit plan ceilings before Postgres row count does.
5. **Compliance ops** (retention, DR, audit IP) incomplete for enterprise procurement.
6. **RAG** not product-ready despite `vector` extension — do not sell as live feature.

## Closed / mitigated (this audit)

| Item | Status |
|------|--------|
| Stage 3 perf indexes + claim RPC | Applied on prod 2026-11-04 |
| EMR own-row RLS + API checks | Present in code |
| Rate-limit fail-closed without Upstash | Present |
| Teaching-case anonymize publish gate | Present |
| AI Gateway Stage 2 | Present (partial adoption) |
| In-app PHI heuristics on chat | Present |

## What this audit did **not** change

- No business logic edits.
- No SQL migrations executed in this pass.
- No production config writes.
- No Colibri install.
- No paid AI calls.
- No load tests on production.

---

## Document index

| File | Content |
|------|---------|
| `00_EXECUTIVE_SUMMARY.md` | Verdict + immediate actions |
| `01_CURRENT_ARCHITECTURE.md` | Monorepo, API, Supabase, Vercel, CI |
| `02_AI_EVIDENCE_AUDIT.md` | Gateway, Evidence, RAG, quotas |
| `03_DATABASE_AUDIT.md` | Pooling, indexes, advisors, storage |
| `04_SECURITY_AUDIT.md` | Auth, RLS, PHI, secrets |
| `05_SCALABILITY.md` | Concurrent scenarios + staging load method |
| `06_HYBRID_ARCHITECTURE.md` | Target swappable hybrid design |
| `07_COST_MODEL.md` | Cost drivers and envelopes |
| `08_IMPLEMENTATION_ROADMAP.md` | Phased plan A–D |
| `09_RISKS_AND_BLOCKERS.md` | This register |
| `_advisor_snapshot.json` | Raw advisor counts (2026-11-04) |
