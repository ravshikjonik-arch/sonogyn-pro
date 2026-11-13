# 07 — Cost Model (order-of-magnitude)

**Disclaimer:** figures are **planning envelopes**, not invoices. No live billing APIs queried. Rates in code (`gateway/cost.ts`) are estimates.

## Cost drivers

| Driver | Scales with | Control |
|--------|-------------|---------|
| Vercel | Bandwidth, function GB-hrs / Active CPU, cron | Cache static; avoid heavy `after()` |
| Supabase | Compute, storage, egress, Realtime, MAU | Pooler; prune media; RLS efficiency |
| Upstash | Commands | Cache TTLs; don’t RL every static asset |
| OpenRouter / Perplexity | Tokens × model price | Quotas, cheaper models, Colibri for bulk |
| US AI Worker | Replicas × hours | Autoscale; PRO-only gate |
| LiveKit | Participant minutes | Webinar schedule |
| S3/Blob | GB stored + egress | Lifecycle policies |
| Evidence external APIs | Calls | Redis cache; adapter tiers |
| SMS / Telegram | Auth volume | Rate limits, Turnstile |

## In-code cost estimates

From `apps/web/lib/ai/gateway/cost.ts` (approx USD / 1k tokens):

| Provider | Input | Output |
|----------|------:|-------:|
| Perplexity | 0.003 | 0.015 |
| OpenRouter (default rate used) | 0.00015 | 0.0006 |
| Colibri | 0 | 0 |

Logged to `ai_chat_events.estimated_cost_usd` — **not** reconciled to invoices.

## Scenarios (monthly ballpark, illustrative)

Assumptions: 20% of MAU use AI weekly; avg 10 LLM calls × 2k tokens; Evidence 30% of AI; vision rare PRO.

| Registered | Est. LLM calls/mo | Cloud LLM $ (order) | Infra note |
|------------|-------------------:|---------------------|------------|
| 1 000 | ~8–20k | tens–low hundreds USD | Stay on current stack |
| 10 000 | ~80–200k | hundreds–low thousands | Need quotas + cache; worker queue |
| 100 000 | ~0.8–2M | thousands–tens of thousands | Org caps; private LLM for bulk; heavy monitoring |

**Vision / DICOM** can dominate if PRO uptake high — size separately using OpenRouter vision + worker hours (`US-AI-SCALE-100-1000.md`).

## Cost risks in code

| ID | Issue | Impact | Priority | Fix |
|----|-------|--------|----------|-----|
| COST-P1-01 | Open-access + incomplete quotas | Unbounded spend | P1 | Close open-access; gateway all routes |
| COST-P1-02 | Quota bypass without SRK | Free tier unlimited | P1 | Fail closed |
| COST-P2-01 | Estimate ≠ invoice | Under-billing alerts | P2 | Export provider usage weekly |
| COST-P2-02 | Evidence fan-out | External API + LLM synthesize cost | P2 | Cache + tier |
| COST-P3-01 | Colibri $0 in meter | Hides infra electricity/GPU | P3 | Separate ops cost sheet |

## Recommendations

1. Hard daily USD cap per doctor (`AI_DOCTOR_DAILY_USD_LIMIT`) in prod.
2. OpenRouter account-level budget alerts.
3. Weekly reconcile: `sum(estimated_cost_usd)` vs provider dashboard.
4. Prefer Colibri/local for bulk non-clinical batch (ingest) when available.
5. Do not enable expensive vision models as default for free tier.

## Verification

- Staging: set low `AI_DOCTOR_DAILY_USD_LIMIT`, confirm 429/402.
- Prod dashboard: provider spend email alerts.
- SQL (staging): `select date_trunc('day', created_at), sum(estimated_cost_usd) from ai_chat_events group by 1`.
