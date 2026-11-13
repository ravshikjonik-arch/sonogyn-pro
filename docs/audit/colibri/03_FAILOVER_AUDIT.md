# 03 — Failover Audit

## Два разных механизма (VERIFIED)

### A. `gatewayChatCompletion` — `apps/web/lib/ai/gateway/chat.ts`

- Итерирует **всю** `resolveProviderChain`.
- Любая ошибка `callOne` → следующий провайдер.
- Нет circuit breaker; нет параллельных fan-out.
- Итог fail: `all_providers_failed:…`.
- **Сценарии A–G для Evidence synthesis** в основном соответствуют ожиданию «попробовать всех».

### B. `/api/ai/chat` classic OpenRouter path — `apps/web/app/api/ai/chat/route.ts` ≈599–662

- Строит `buildGatewayAttemptChain`.
- При ошибке продолжает **только если** `isRetryableProviderError(status)`  
  (`model-fallback.ts`): **429, 502, 503, 504**.
- Иначе — **сразу return error** (≈646–662).

`callOpenRouterChat` при сетевой ошибке / `ECONNREFUSED` возвращает **`status: 500`, `code: "unknown"`** (`openrouter-client.ts` ≈76–81) — **не retryable** в chat route.

**RISK (P0):** Colibri first + sidecar down → chat **не** уходит на OpenRouter.

### C. AI SDK stream path — тот же route ≈498–566

- `try/catch` на attempt; при exception → `continue` к следующему.
- Лучше переживает падение Colibri, чем classic path.
- Comment: «skip pure local if SDK not wired» — фактически всё же пробует Colibri через OpenAI-compatible base.

---

## Сценарии A–G

| ID | Сценарий | Ожидание (продукт) | Факт: gatewayChatCompletion | Факт: /api/ai/chat classic | Статус |
|----|----------|--------------------|------------------------------|----------------------------|--------|
| A | Colibri UP | Ответ с Colibri | Primary success | Primary success | VERIFIED by design |
| B | Colibri OFF / refused | Cloud без долгой задержки | Next provider (fast refuse) | **Может 500/error без fallback** | **RISK** |
| C | Colibri slow | Timeout → cloud | 180s затем next | 504 → **fallback OK** | PARTIALLY (latency RISK) |
| D | Colibri 4xx/5xx | Fallback cloud | Next | Только 502/503; **401/500 — нет** | **RISK** |
| E | OpenRouter down | Perplexity / fail | Next in chain | Depends position + retryable | PARTIALLY |
| F | Perplexity down | OpenRouter | Next | Same | PARTIALLY |
| G | All down | Controlled error | `all_providers_failed` | Error after first non-retryable or exhaust | VERIFIED patterns differ |

**Циклы:** нет (linear).  
**Бесконечный retry:** нет; cloud maxAttempts=2; local=1.  
**Дубли запросов:** sequential; при failover — **да, повтор полного prompt** (ожидаемо). Evidence chat может дать **2 успешных** LLM (synthesis + answer) — см. `06`.

---

## `COLIBRI_ENABLED=true` и зависимость от localhost

| Среда | Поведение |
|-------|-----------|
| Local Next + Colibri down + order colibri first | Chat classic: **ломается** (P0). Evidence synthesis: обычно cloud OK. |
| Vercel без COLIBRI_* | Colibri не в chain → OK. **NOT VERIFIED** actual env. |
| Vercel с COLIBRI_BASE_URL=127.0.0.1 | Refuse fast; chat classic всё равно может **не** fallback. **RISK if misconfigured**. |
| Remote Colibri URL hang | До **180s** на attempt перед fallback (gateway) / 504 fallback (chat). |

---

## HTTP codes

| Code | openrouter-client | gateway loop | chat classic fallback |
|------|-------------------|--------------|------------------------|
| 401/403 | fail, no retry | next provider | **no** (not retryable) |
| 429 | retry then fail | next | **yes** |
| 500 (conn) | fail | next | **no** |
| 502/503 | retry | next | **yes** |
| 504 timeout | abort→504 | next | **yes** |

---

## Circuit breaker / concurrency

| Механизм | Есть? |
|----------|-------|
| Circuit breaker | **Нет** |
| Health-based skip | **Нет** (status отдельный) |
| Parallel provider race | **Нет** |
| Doctor quota | **Да** `assertAiGatewayQuota` |
| Rate limit evidence | **Да** в chat route |

---

## Рекомендации (не реализованы в этом аудите)

1. В chat classic: fallback на **любой** transport/5xx/empty от non-last provider (как gateway).  
2. Перед chain: если `isLocal && !healthy` (кэш ping 2–5s) — skip.  
3. Для local timeout снизить 180s → 5–15s connect / 60s first token.  
4. Unit-тест: Colibri ECONNREFUSED → OpenRouter called.

**Вывод:** failover **не полностью безопасен** для chat UX при мёртвом Colibri. Evidence synthesis путь заметно лучше.
