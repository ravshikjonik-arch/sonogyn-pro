# 02 — AI Evidence Audit

**Evidence-based:** only what exists in TypeScript/SQL. Docs alone ≠ production.

## Summary matrix

| Capability | In code | Stub / docs-only |
|------------|---------|------------------|
| In-app AI Gateway + failover | Yes | — |
| Anthropic / Gemini native SDK | **No** | Mentions absent in `.ts` |
| Vercel AI Gateway product | **Not used** | — |
| Evidence multi-adapter search | Yes | — |
| LLM synthesis for Evidence | Yes (`synthesize-llm.ts`) | — |
| pgvector hybrid RAG | Schema only | Embed pipeline, HNSW, app ANN |
| Chat quotas + cost estimate | Partial (chat + evidence assistant) | Most `/api/ai/*` assist routes |
| Prompt injection heuristics | Yes | Not full DLP |
| PHI detect on chat | Yes | `evidence_query_log` stores query text |

## 1. AI Gateway (implemented)

**Path:** `apps/web/lib/ai/gateway/`

| File | Role |
|------|------|
| `resolve.ts` | Chain: text/evidence `colibri → perplexity → openrouter`; vision `openrouter → colibri` |
| `chat.ts` | Sequential failover |
| `cost.ts` | Rough USD/1k token estimates |
| `doctor-quota.ts` | Daily request/USD from `ai_chat_events` |
| `status.ts` | Colibri `/models` ping + key presence |
| `GET /api/ai/gateway/status` | HTTP surface |

**Env (names):** `LLM_PROVIDER`, `LLM_FALLBACK_ORDER`, `LLM_STRICT_PROVIDER`, `COLIBRI_*`, `PERPLEXITY_*`, `OPENROUTER_*`, `AI_DOCTOR_DAILY_REQUEST_LIMIT`, `AI_DOCTOR_DAILY_USD_LIMIT`.

**Default models in code:** Perplexity `sonar-pro`; OpenRouter `openai/gpt-4o-mini` (overridable).

**Legacy:** `apps/web/lib/ai/llm-provider.ts` re-exports gateway (`@deprecated`).

## 2. Providers actually used

| Provider | How | Credential env |
|----------|-----|----------------|
| Colibri | OpenAI-compatible HTTP | `COLIBRI_BASE_URL`, `COLIBRI_API_KEY`, models |
| Perplexity | Chat completions | `PERPLEXITY_API_KEY` |
| OpenRouter | Chat + many direct callers | `OPENROUTER_API_KEY` |
| OpenAI | Whisper only | `OPENAI_API_KEY` |
| US AI Worker | Separate FastAPI | `US_AI_WORKER_URL`, `US_AI_WORKER_SECRET` |

**Not in codebase as first-class providers:** Anthropic, Google Gemini SDKs.

## 3. Routes that bypass Gateway

Direct OpenRouter / worker (no unified failover/metering):

- `apps/web/app/api/ai/orads/route.ts`
- `apps/web/lib/ai/tutor/orchestrate.ts`
- `apps/web/lib/ai/us-vision/vision-provider.ts`
- `apps/web/lib/messenger/ai/messenger-community-tutor.ts`
- Assist routes → US AI Worker (`gyn-assist`, …)

## 4. Evidence stack

| Layer | Path |
|-------|------|
| Corpus | `packages/evidence-corpus` |
| Shelf search | `packages/evidence-engine` → `/api/evidence/ask` |
| Unified adapters | `packages/evidence-retrieval` → `/api/evidence/search`, assistant |
| Web glue | `apps/web/lib/evidence/*` (Redis cache, LLM synthesize, logging) |
| Medical knowledge | Keyword SQL + client filter — **not** vector (`supabase-repository.ts`) |

**Adapters (HTTP/static):** PubMed, Europe PMC, Cochrane, Semantic Scholar, ClinicalTrials, KR MЗ РФ, static corpus, OpenFDA, DailyMed, WHO, NICE, EMA, RF regulation, Crossref.

**Fan-out:** orchestrator runs enabled adapters in parallel (~8s timeout each) — latency/cost amplifier at scale.

## 5. Embeddings / RAG

| Artifact | Status |
|----------|--------|
| Extension `vector` | Installed on project |
| `source_chunks.embedding vector(1536)` | Migration `20260824180000_medical_source_vault.sql` — comment “future hybrid RAG” |
| HNSW/IVFFlat index | **Not in repo migrations** |
| TS writer/reader of embeddings | **0 references** to `source_chunks` embedding ops |
| Chat “RAG” | Filesystem JSON + package knowledge (`sonogyn-chat/rag-context.ts`) |

## 6. Chat, quotas, cost

| Mechanism | File | Gap |
|-----------|------|-----|
| Rate limits | `rate-limit-config.ts` `RL.aiChat*` | OK |
| Gateway quota | `doctor-quota.ts` — loads day events then sums in JS | O(n) scaling |
| Monthly free limit | `sonogyn-chat/cost-control.ts` | Missing service role → **Pro bypass** |
| Cost log | `ai_chat_events.estimated_cost_usd` | Not billing |
| Coverage | Only chat + evidence assistant consistently | Assist/tutor/orads skip |

## 7. Safety

| Control | Path |
|---------|------|
| Prompt injection regex | `sonogyn-chat/security/prompt-injection.ts` |
| PHI detect | `lib/security/phi-detection.ts` (chat) |
| Redact logs | `redact-log.ts` |
| Chat event body | Not stored in `log-event.ts` |
| Evidence query log | Up to 500 chars query text — PHI retention risk |
| Tool ACL | Calculator allowlist only |

## 8. Background AI

| Job | Pattern |
|-----|---------|
| Regulation extract | Cron + claim RPC + optional LLM |
| Guidelines ingest | Cron script |
| US analyze | `after()` + `ai_analyses`, `maxDuration=300` |
| Copilot orchestrator | In-process `Promise.all` agents |

## Findings

| ID | File | Problem | Impact | Priority | Solution | Verify |
|----|------|---------|--------|----------|----------|--------|
| AI-P1-01 | `sonogyn-chat/cost-control.ts` ~27–28 | No service role → monthly quota bypass | Unlimited free AI | P1 | Fail closed without SRK | Unit test + staging without key → 403/limit |
| AI-P1-02 | `gateway/doctor-quota.ts` ~59–71 | Full day row fetch + JS sum | Slow chat under volume | P1 | SQL `sum`/`count` aggregate | Explain + load synthetic events |
| AI-P2-01 | Split OpenRouter callers | No failover/meter | Cost surprises, outages | P2 | Route all via `gatewayChatCompletion` | Grep `OPENROUTER_API_KEY` outside gateway |
| AI-P2-02 | Evidence orchestrator fan-out | Parallel ~12 adapters | Tail latency, API bans | P2 | Tier adapters; cache; circuit breaker | Latency histogram on `/api/evidence/search` |
| AI-P2-03 | `analyze/route.ts` `after()` | Non-durable jobs | Lost work at scale | P2 | Worker queue Phase 2 | Fail rate under synthetic load |
| AI-P2-04 | Vault embedding unused | Schema debt | False sense of RAG | P2 | Stage 4 or drop unused column | Confirm no ANN queries |
| AI-P3-01 | AI SDK path skips Colibri | Local-first undermined | Ops surprise | P3 | Wire or document | Gateway status + AI_SDK_ENABLED |
| AI-P2-05 | `log-evidence-query.ts` | Raw query stored | PHI in logs | P2 | Hash/redact like chat | Insert probe without PHI |

## Models in practice

- **Configured by env**, not hardcoded product SKU list.
- Defaults lean on **OpenRouter `openai/gpt-4o-mini`** and **Perplexity `sonar-pro`**.
- Vision: OpenRouter US vision model env; Colibri only if `COLIBRI_VISION_MODEL` set.
- Cost rates in `gateway/cost.ts` are **estimates**, not invoices.
