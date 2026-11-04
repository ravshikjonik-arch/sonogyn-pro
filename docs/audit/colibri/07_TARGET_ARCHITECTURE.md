# 07 — Target Architecture

## Цели

1. Провайдеры через единый интерфейс (`ResolvedLlm` / Gateway).  
2. Colibri **полностью optional**.  
3. Production **не** зависит от laptop.  
4. Dead Colibri **не** замедляет и **не** ломает cloud.  
5. Failover **не** теряет Evidence policy.  
6. Citations обязательны в Evidence.  
7. Единый security layer (auth, PHI, injection, quota).  
8. Метрики/аудит provider, latency, fallback, cost.  
9. Будущие vLLM / SGLang / corp endpoint = тот же OpenAI-compatible adapter.

## Предлагаемая схема (эволюционно, без rewrite)

```text
                    ┌── SecurityLayer (auth, PHI, injection, quota)
Request ───────────►│
                    └── PolicyBundle (clinical | evidence | vision)
                              │
                              ▼
                    ProviderRouter
                      - order from env + purpose
                      - health cache (skip unhealthy local)
                      - short connect timeout for isLocal
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
         ColibriOpt      OpenRouter        Perplexity
         (doctor-box)    (prod default)    (evidence/search)
              │               │                │
              └───────────────┴────────────────┘
                              ▼
                    ResponseNormalizer + EvidenceValidator
                              ▼
                    Telemetry (provider, attempts, $)
```

## Provider interface (уже почти есть)

Расширить, не ломая:

```ts
// conceptual — не внедрять в этом аудите
type ProviderAdapter = {
  id: GatewayProviderId | string;
  resolve(purpose): ResolvedLlm | null;
  health(): Promise<boolean>;
  supports: { jsonObject: boolean; vision: boolean; stream: boolean };
};
```

Новые engines (vLLM): `OPENAI_COMPAT_BASE_URL` + model id → тот же `callOpenRouterChat` / AI SDK.

## Prod defaults (RECOMMENDATION)

```bash
LLM_PROVIDER=auto
LLM_FALLBACK_ORDER=openrouter,perplexity
# COLIBRI_* unset on Vercel
```

Doctor-box / local:

```bash
COLIBRI_ENABLED=true
LLM_FALLBACK_ORDER=colibri,openrouter,perplexity
# + health skip
```

## Evidence

- Retrieval всегда first.  
- Synthesis LLM optional.  
- Validator: citations present / insufficient path.  
- Один LLM pass предпочтителен (cost).

## Monitoring

- Расширить `/api/ai/gateway/status` (без секретов).  
- Метрики: `ai_provider_attempt_total{provider,result}`, latency histogram, fallback ratio.

## Что не делать

- Не мигрировать на внешний «Vercel AI Gateway product» ради ради.  
- Не требовать GPU для MVP.  
- Не vendor Colibri внутрь monorepo git.
