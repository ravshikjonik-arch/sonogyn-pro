# 01 — Current Implementation Map

## Компоненты (VERIFIED)

| Компонент | Путь | Роль |
|-----------|------|------|
| Gateway resolve | `apps/web/lib/ai/gateway/resolve.ts` | Цепочка провайдеров |
| Gateway chat | `apps/web/lib/ai/gateway/chat.ts` | `gatewayChatCompletion` + failover all |
| Gateway status | `apps/web/lib/ai/gateway/status.ts` | Ping Colibri `/models`; keys presence |
| Gateway cost/quota | `cost.ts`, `doctor-quota.ts` | Telemetry USD + daily limits |
| Types | `gateway/types.ts` | `colibri \| perplexity \| openrouter` |
| Legacy re-export | `apps/web/lib/ai/llm-provider.ts` | `@deprecated` → gateway |
| HTTP client | `sonogyn-chat/openrouter-client.ts` | OpenAI-compatible POST; retry 429/502/503/529 |
| Chat API | `apps/web/app/api/ai/chat/route.ts` | Clinical + Evidence UX |
| Model chain | `sonogyn-chat/model-fallback.ts` | `buildGatewayAttemptChain` |
| AI SDK adapter | `lib/ai/sdk/provider.ts` | OpenAI-compatible baseURL (Colibri/OR/Pplx) |
| Evidence LLM | `lib/evidence/synthesize-llm.ts` | JSON synthesis via gateway |
| Evidence prompt | `sonogyn-chat/evidence-context.ts` | Citations-only system prompt |
| Colibri scripts | `scripts/colibri/*`, `integrations/colibri/README.md` | setup/start/wire/check |
| Docs | `docs/integrations/colibri.md`, `docs/ai/gateway.md` | Ops |

## Env (имена; значения секретов не приводятся)

Из `apps/web/.env.example` и локальной проверки `.env.local` (2026-11-04):

| Переменная | Локально | Назначение |
|------------|----------|------------|
| `COLIBRI_ENABLED` | `true` | Включает Colibri в resolve |
| `COLIBRI_BASE_URL` | `http://127.0.0.1:8000/v1` | OpenAI base |
| `COLIBRI_MODEL` | `qwen36-35b` | Text/evidence model id |
| `COLIBRI_API_KEY` | set | Bearer (local default `colibri-local`) |
| `LLM_PROVIDER` | `auto` | Forced provider or auto |
| `LLM_FALLBACK_ORDER` | `colibri,openrouter,perplexity` | Order override |
| `LLM_STRICT_PROVIDER` | absent | Если `1` — без failover |
| `OPENROUTER_API_KEY` | set | Cloud |
| `PERPLEXITY_API_KEY` | absent | Cloud search/sonar |

Production Vercel: **NOT VERIFIED** (API 403).

## Локальная установка Colibri (безопасная проверка)

| Проверка | Результат | Статус |
|----------|-----------|--------|
| `$HOME/colibri` | present | VERIFIED |
| `$HOME/colibri-models/qwen36-35b` | ~1.3G, partial shards | VERIFIED incomplete |
| `GET :8000/v1/models` | connection refused | VERIFIED down |
| `coli` process | none | VERIFIED |

## Потребители Gateway

| Путь | Использует полный chain? |
|------|---------------------------|
| `synthesize-llm.ts` → `gatewayChatCompletion` | **Да** |
| `/api/ai/chat` → `buildGatewayAttemptChain` | **Частично** (см. `03`) |
| `calculator-report-refine`, `vascular-ultrasound-assist`, `regulations/extract-with-llm` | Часто только `resolveLlmProvider` (**primary only**) |
| orads / tutor / us-vision / assist workers | **Вне** Gateway (enterprise audit) |

## Поток запроса (целевой дизайн в коде)

```text
Client → /api/ai/* → (auth, PHI, injection, quota)
       → resolveProviderChain(purpose)
       → provider HTTP OpenAI-compatible
       → response / failover
```

Evidence chat:

```text
User question
  → searchEvidenceUnified (adapters, not LLM)
  → synthesizeWithLlm (gatewayChatCompletion, purpose=evidence)
  → buildEvidenceModeSystemPrompt(citations…)
  → второй LLM call (chat route) для ответа врачу
  OR insufficient → static stream, без LLM #2
```

## Тесты

| Файл | Покрытие |
|------|----------|
| `gateway/__tests__/resolve.test.ts` | Order, vision skip Colibri, json mode |
| `evidence-context.test.ts` | Insufficient / empty citations |
| Failover chat ECONNREFUSED | **Нет** (gap) |

## Вывод

Архитектура Stage-2 Gateway **существует и документирована**. Colibri — **optional OpenAI-compatible** слот. Фактический sidecar **не готов к работе**. Риск — не «нет кода», а **несогласованный failover** и **локальный env с Colibri first**.
