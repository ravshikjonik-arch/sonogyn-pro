# AI Gateway — Этап 2

Единая точка LLM для SonoGyn Pro: маршрутизация, failover, учёт стоимости, лимиты врача.

## Модуль

`apps/web/lib/ai/gateway/`

| Файл | Роль |
|------|------|
| `resolve.ts` | Цепочка провайдеров (default: OpenRouter → Perplexity → Colibri) |
| `chat.ts` | `gatewayChatCompletion` + failover |
| `cost.ts` | оценка USD (telemetry) |
| `doctor-quota.ts` | дневные лимиты запросов / $ + monthly free |
| `status.ts` | health без секретов |

Совместимость: `lib/ai/llm-provider.ts` реэкспортирует resolve.

## Env

См. `apps/web/.env.example` (блок AI Gateway).

## API

`GET /api/ai/gateway/status?purpose=text|evidence|vision`

## Потребители (подключено)

- Evidence synthesis → `synthesize-llm.ts` через `gatewayChatCompletion`
- Evidence Assistant → `assertAiGatewayQuota` перед LLM
- `/api/ai/chat` → `buildGatewayAttemptChain` + failover Colibri/Perplexity/OpenRouter + quota

## Ещё на primary resolve (без полного chain loop)

- tutor, messenger, vision-provider — следующий инкремент

## Связь с дорожной картой

- Этап 2: этот документ ✅
- Этап 5: Colibri self-host / GPU cost — `docs/integrations/colibri.md`
