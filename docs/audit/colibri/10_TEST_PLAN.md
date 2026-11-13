# 10 — Test Plan (безопасный)

Без платных внешних вызовов в CI по умолчанию; cloud — только с явным флагом/`ALLOW_LIVE_LLM=1`.

## Unit (обязательные после Phase 1)

| # | Кейс | Ожидание |
|---|------|----------|
| U1 | `resolveProviderChain` с COLIBRI_ENABLED + keys | order по env |
| U2 | Mock fetch Colibri ECONNREFUSED → gateway next OR | success openrouter |
| U3 | Chat classic same as U2 | **сейчас fail — тест red → green после фикса** |
| U4 | Colibri 401 → gateway next; chat after fix next | |
| U5 | Vision without COLIBRI_VISION_MODEL | no colibri |
| U6 | Evidence insufficient → no provider call | |
| U7 | `detectPhi` / injection fixtures | |

Уже есть: `gateway/__tests__/resolve.test.ts`, `evidence-context.test.ts`.

## Integration (local, opt-in)

| # | Кейс | Условие |
|---|------|---------|
| I1 | `pnpm colibri:check` | sidecar optional |
| I2 | `GET /api/ai/gateway/status?purpose=evidence` | Next running; no secrets in body |
| I3 | Evidence ask with OPENROUTER only | `ALLOW_LIVE_LLM=1` |

## Medical golden set (manual / recorded)

| # | Вопрос-фикстура | Assert |
|---|-----------------|--------|
| M1 | O-RADS version mention | hint / no mix editions |
| M2 | Empty retrieval | insufficient language, no invented PMID |
| M3 | Same query Colibri vs OR (когда Colibri up) | structure + citation ids subset |

## Load (later)

- Не гонять 100k sim на real providers.  
- Synthetic: mock providers, measure failover latency distribution.

## Regression checklist before prod env change

- [ ] No `COLIBRI_ENABLED` on Vercel (or remote healthy URL)  
- [ ] `LLM_FALLBACK_ORDER` cloud-first on Vercel  
- [ ] Chat smoke clinical + evidence  
- [ ] Quota still fail-closed without SRK  
