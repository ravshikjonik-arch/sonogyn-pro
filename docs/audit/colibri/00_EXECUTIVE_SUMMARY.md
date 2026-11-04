# 00 — Executive Summary: Colibri & AI Gateway

**Дата аудита:** 2026-11-04  
**Режим:** READ-ONLY (код + безопасные локальные проверки; без платных LLM-вызовов, без скачивания моделей, без изменения env/Vercel/Supabase).  
**Объект:** SonoGyn Pro monorepo — AI Gateway, Colibri sidecar, OpenRouter, Perplexity, Evidence synthesis.

---

## Вердикт в одном абзаце

Интеграция Colibri в **код и локальный `.env.local` есть**, живой inference **нет**. Production по дизайну должен идти через облако; полная независимость от Colibri **частично** реализована в `gatewayChatCompletion`, но **сломан partial failover** в `/api/ai/chat` при «не-retryable» ошибках первого провайдера (в т.ч. `ECONNREFUSED` → HTTP 500). При `COLIBRI_ENABLED=true` + Colibri первым в цепочке локальный Next может **падать в ошибку вместо OpenRouter**. GPU сейчас **не нужен**.

---

## Статусы ключевых фактов

| Утверждение | Статус | Доказательство |
|-------------|--------|----------------|
| `~/colibri` существует | **VERIFIED** | local FS |
| Модель `qwen36-35b` скачана полностью (~23 GB) | **RISK / PARTIALLY** | `~/colibri-models/qwen36-35b` ≈ **1.3 GB**, есть `.part` |
| Sidecar на `:8000` работает | **VERIFIED down** | `curl` → connection refused; процесс `coli` не найден |
| `COLIBRI_ENABLED=true` в локальном env | **VERIFIED** | `apps/web/.env.local` (только имена/не-секретные значения) |
| `OPENROUTER_API_KEY` локально задан | **VERIFIED** (presence) | `.env.local` |
| `PERPLEXITY_API_KEY` локально | **VERIFIED absent** | `.env.local` |
| Gateway resolve: Colibri → … | **VERIFIED** | `apps/web/lib/ai/gateway/resolve.ts` |
| Failover «попробовать всех» в `gatewayChatCompletion` | **VERIFIED** | `gateway/chat.ts` |
| Failover в `/api/ai/chat` только на 429/502/503/504 | **RISK** | `chat/route.ts` + `isRetryableProviderError` |
| Evidence: citations + retrieval до LLM | **VERIFIED** | `synthesize-llm.ts`, `evidence-context.ts` |
| COLIBRI_* на Vercel Production | **NOT VERIFIED** | Vercel env API 403 без re-auth |
| Нужен GPU сейчас | **RECOMMENDATION: no** | стоимость / incomplete setup |

---

## Топ-риски (P0–P2)

1. **P0 — Chat failover gap** (`apps/web/app/api/ai/chat/route.ts` ≈629–662): при падении Colibri с `status=500` (сеть/`ECONNREFUSED`) fallback на OpenRouter **не выполняется**; пользователь получает ошибку, хотя ключ OpenRouter есть.  
2. **P1 — Локальный DX:** `LLM_FALLBACK_ORDER=colibri,openrouter,…` + down sidecar → ломает локальный chat (см. P0); Evidence synthesis через `gatewayChatCompletion` обычно **переживает** отказ Colibri.  
3. **P1 — Двойной LLM в Evidence chat:** retrieval synthesis (`synthesizeWithLlm` → gateway) **плюс** второй вызов провайдера с evidence system prompt → риск **двойной оплаты** при успешном Colibri/облаке.  
4. **P2 — Нет circuit breaker / health-aware routing:** `getGatewayStatus` пингует Colibri, но **не исключает** unhealthy из `resolveProviderChain`.  
5. **P2 — Неполная унификация:** tutor/orads/vision/assist часто **минуют** Gateway (см. enterprise audit).

---

## Ответы на 10 контрольных вопросов

1. **Работает ли Colibri фактически?** — **Нет.** **VERIFIED** (порт 8000 down, модель неполная).  
2. **Может ли `COLIBRI_ENABLED=true` ухудшать production?** — **Да, если** те же env попадут на Vercel/remote с недоступным `COLIBRI_BASE_URL`, **и** запрос идёт через chat-route failover (не gateway). На чистом Vercel без COLIBRI_* — **скорее нет**. Prod env: **NOT VERIFIED**.  
3. **Безопасен ли текущий failover?** — **Частично.** Gateway chat — да (sequential all). `/api/ai/chat` classic path — **RISK**.  
4. **Сохраняется ли медицинская целостность при смене модели?** — **В основном да** для Evidence (retrieval + fixed prompts + post-parse citation filter). **Нет жёсткой гарантии** на уровне провайдера; compliance = prompt + retrieval. **PARTIALLY VERIFIED**.  
5. **Риск двойной оплаты?** — **Да (Evidence mode chat).** **VERIFIED** по коду.  
6. **Риск утечки PHI?** — **Снижен** (`detectPhi` на chat), **не устранён** (эвристика; history/clinical memory; query logging). **PARTIALLY VERIFIED / RISK residual**.  
7. **Что чинить первым?** — Failover в chat: retry/fallback на transport errors + skip unhealthy local; локально убрать Colibri из primary order или `COLIBRI_ENABLED=false` до sidecar.  
8. **Арендовать GPU?** — **Нет.** **RECOMMENDATION**.  
9. **Сохранить Colibri в архитектуре?** — **Да как optional doctor-box**, не как prod dependency. **RECOMMENDATION**.  
10. **100k врачей?** — Gateway + quota + cloud providers scale; Colibri на ноутбуках **не** масштабируется; нужен shared inference или только cloud + квоты/кэш Evidence. См. `06` / `07`.

---

## Что делать дальше (без GPU)

1. Не арендовать VK GPU / дорогой Ice Lake.  
2. Локально: `COLIBRI_ENABLED=false` **или** `LLM_FALLBACK_ORDER=openrouter,perplexity` до рабочего sidecar (ops, не код — по решению владельца).  
3. После явного approve: патч failover в `chat/route.ts` + health-skip Colibri.  
4. Проверить Production env names (без decrypt): нет ли `COLIBRI_*` / `LLM_FALLBACK_ORDER` с colibri first.

Подробности: `01`–`10` в этой папке.
