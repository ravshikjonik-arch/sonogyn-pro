# 06 — Target Hybrid Cloud Architecture

**Goal:** scale without rewriting clinical business logic; each vendor swappable behind adapters.  
**Non-goals:** migrate off Vercel/Supabase “for sport”; buy on-prem hardware now.

## Target logical diagram

```text
                    ┌─────────────────────────────┐
   Web / Mobile ───►│  Vercel Application Layer   │
                    │  Next.js API + SSR + Cron   │
                    └───────────┬─────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          ▼                     ▼                     ▼
   ┌──────────────┐    ┌────────────────┐    ┌─────────────────┐
   │ Supabase     │    │ AI Gateway     │    │ Object Storage  │
   │ PG+Auth+RLS  │    │ (in-app →     │    │ (S3/Blob/Yandex)│
   │ Storage+RT   │    │  dedicated svc)│    └─────────────────┘
   └──────────────┘    └───────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        OpenRouter      Perplexity      Private GPU/Colibri
        (cloud LLM)     (cloud LLM)     (optional pool)
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             Background Workers    US AI Worker / Vision
             (queue consumers)     (Railway/Fly/GPU)
                    │
             Upstash Redis (RL + cache)
             Sentry / logs / metrics
```

## Layer contracts (swap without rewriting domain)

| Layer | Current | Target interface | Replace with |
|-------|---------|------------------|--------------|
| App | Vercel Next | HTTP/JSON Zod APIs | Other Node host (rare) |
| DB | Supabase PG | SQL + RLS; PostgREST via Supabase client | Another PG + custom API (high cost) |
| Auth | Supabase Auth | Session JWT / cookies | Keep unless enterprise IdP (Passport/OIDC) |
| AI | `gatewayChatCompletion` | `{messages, purpose} → completion` | Any OpenAI-compatible |
| Evidence search | `searchEvidenceUnified` | Query → ranked citations | Add/remove adapters |
| Vision | `ai_analyses` job + poll | JobId contract | Worker queue backends |
| Cache/RL | Upstash REST | get/set + ratelimit | Redis/Valkey compatible |
| Files | Supabase Storage + S3/Blob | Signed URL API | Any S3 API |
| Payments | Stripe/YooKassa | Webhook + entitlement | Regional PSP |
| Realtime | Supabase Realtime | Channel subscribe | Optional LiveKit-only for video |

## Component recommendations

### Keep now

- Vercel app region `fra1` aligned with Supabase `eu-west-1`.
- Supabase managed Postgres + RLS as system of record.
- In-app Gateway until traffic justifies extracting a separate Gateway service.
- Upstash for distributed RL/cache.

### Add when metrics trip (see 00 / 05)

1. **Durable job queue** for US analyze & heavy extract (Vercel Queues / PG `SKIP LOCKED` workers / Redis queue).
2. **Dedicated AI Gateway service** only if many non-Next consumers need same metering.
3. **Private GPU / Colibri pool** behind same OpenAI-compatible URL — already modelled in `resolve.ts`.
4. **Object storage** for large DICOM outside Supabase when object count/cost grows.
5. **Staging Supabase** for migrations and load tests.
6. **Monitoring:** Sentry + structured `/api/health` + provider spend alerts + Supabase advisors weekly.

### Explicitly defer

- Full pgvector RAG until corpus licensing + embed pipeline designed (Stage 4).
- Multi-region active-active (complexity > benefit before 100k).
- Replacing Supabase Auth mid-growth.

## Disaster recovery sketch

| Item | Target |
|------|--------|
| RPO | Document from Supabase PITR window |
| RTO | Redeploy Vercel + point env; restore DB PITR |
| Backups | Managed + periodic logical dump of critical catalogs (non-PHI teaching) |
| Secrets | Vercel env + rotation runbook; never in git |
| Failover AI | Gateway chain already; keep ≥2 cloud providers configured |

## Mapping to existing code

| Concern | Existing hook |
|---------|---------------|
| Provider swap | `LLM_PROVIDER` / `LLM_FALLBACK_ORDER` |
| Analyze executor | Env comment `AI_ANALYZE_EXECUTOR` + `US-AI-SCALE-100-1000.md` |
| Regulation workers | `claim_regulation_ingest_jobs` |
| Evidence cache | `createEvidenceCacheStore()` |
| Health | `/api/health` stage3 flags |

## Findings

| ID | Problem | Priority | Solution |
|----|---------|----------|----------|
| HYB-P2-01 | Gateway not universal | P2 | Migrate remaining callers |
| HYB-P2-02 | No extracted worker for vision | P2 | Phase 2 queue |
| HYB-P3-01 | RAG schema without pipeline | P3 | Stage 4 design doc then build |
| HYB-P2-03 | No DR runbook file | P2 | Add `docs/operations/dr.md` |
