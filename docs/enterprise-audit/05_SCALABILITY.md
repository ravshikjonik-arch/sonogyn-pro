# 05 — Load & Scalability

**Constraint:** no load tests against production. Scenarios are **capacity models** from architecture evidence + existing docs (`US-AI-SCALE-100-1000.md`, `stage3-infra.md`).

## Workload classes

| Class | Examples | Scales with |
|-------|----------|-------------|
| **HTTP app** | Pages, calculators, LMS | Vercel Fluid concurrency |
| **API CRUD** | patients, cases, profile | PostgREST + RLS + pooler |
| **Realtime** | Messenger, presence, case discussion | Supabase Realtime connections |
| **AI text** | Chat, Evidence LLM | Provider RPM + gateway quotas + cost |
| **AI vision** | `/api/ai/analyze`, worker | `after()` duration / worker replicas |
| **Evidence HTTP fan-out** | Multi-adapter search | External API limits + Redis cache |
| **Background** | Crons, regulation claim | Cron schedule + queue depth |
| **Storage** | Ultrasound / teaching media | Object count + bandwidth |

## Concurrent-user scenarios (model)

Assumptions for modelling (not measured): DAU ≈ 20–40% of registered; concurrent ≈ 5–10% of DAU at peak; AI mix ≈ 10–20% of concurrent hit LLM.

| Concurrent | Registered (rough) | HTTP | DB | Realtime | AI | Background |
|------------|--------------------|------|----|----------|----|------------|
| **100** | ~1–3k | Comfortable on Vercel Pro | Low (EMR empty today) | Low | Gateway + Upstash OK | Crons fine |
| **500** | ~5–15k | Watch function concurrency | RLS initplan matters if EMR fills | Presence/messenger pressure | Evidence fan-out + quota O(n) | US `after()` saturation risk |
| **1 000** | ~10–30k | Need CDN/cache discipline | Index + pooler upgrade likely | Channel design required | **Must** have unified metering + adapter tiers | Move analyze to queue |
| **5 000** | ~50–100k+ | Multi-region / edge caching optional | Dedicated compute tier / read replicas strategy | Shard presence | Org quotas; private LLM optional | Worker autoscaling |

### Per-class notes

**100 concurrent**

- Current stack (Vercel fra1 + Supabase + Upstash) adequate if open-access off and secrets correct.
- AI: OpenRouter account limits dominate over CPU.

**500 concurrent**

- Evidence search without Redis hit rate → external 429.
- Messenger Realtime: validate channel count.
- US analyze Phase 0 (`after()`) — start measuring fail%.

**1 000 concurrent**

- Trigger Phase 2 US queue (`docs/architecture/US-AI-SCALE-100-1000.md`).
- SQL aggregate quotas; fix DEFINER/RPC security before marketing blast.
- Consider Supabase compute add-on / larger pool.

**5 000 concurrent**

- Org tenancy, durable queues, optional Colibri/GPU pool, cost budgets per org.
- Not solved by “bigger single Vercel project” alone.

## Bottlenecks ranked

1. LLM provider rate/cost (external).
2. Evidence adapter fan-out.
3. US analyze `after()` durability.
4. Supabase RLS initplan + unindexed FKs when EMR grows.
5. Realtime connection ceilings.
6. Split metering → surprise spend.

## Safe staging load-test methodology

### Principles

- **Never** hit production URL with k6/artillery at scale.
- Synthetic users only; **no real patient PHI**.
- Prefer Supabase **branch** or separate project (Pro).
- Cap AI tests: mock LLM or use cheapest model + hard `$` budget; or stub gateway.

### Steps

1. **Staging env** with production-like schema (migrations applied).
2. **Seed script:** N doctors, fake patients (`patient-*` ids), teaching cases without real media PHI.
3. **k6 suites:** extend `apps/web/scripts/k6/messenger-chat-v2-smoke.js` pattern:
   - Health + auth login
   - Patients list/create
   - Calculator pages (no AI)
   - Messenger send (synthetic)
   - AI chat **mocked** or 1% sample with budget
4. **Observability:** `/api/health` latency, Sentry, Supabase reports, Upstash dashboard.
5. **Pass criteria:** p95 API < budget in `docs/performance/performance-budget.md`; error rate < 1%; no RLS leaks in IDOR checks.
6. **Stop conditions:** DB CPU > 80% sustained, provider 429 storm, cost alert.

### What not to do

- No DDOS-style traffic to prod.
- No parallel unpaid OpenRouter soak without cap.
- No load against LiveKit with real webinars.

## Findings

| ID | Evidence | Problem | Impact | Priority | Solution | Verify |
|----|----------|---------|--------|----------|----------|--------|
| SCALE-P1-01 | `analyze/route.ts` | `after()` executor | Job loss at 500+ | P1→P2 by growth | `AI_ANALYZE_EXECUTOR=worker_queue` | Fail% under staging load |
| SCALE-P2-01 | Evidence orchestrator | Fan-out | Latency cliffs | P2 | Tier + cache SLO | p95 search |
| SCALE-P2-02 | No staging branch | Cannot safely load-test | Blind scale | P2 | Pro branch / twin project | Branch exists |
| SCALE-P3-01 | Performance baseline TBD | No numeric prod SLO | Guesswork | P3 | Fill `docs/performance/baseline.md` | Dashboard |
