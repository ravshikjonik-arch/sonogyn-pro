# 11 — P0 Failover Patch Report

**Дата:** 2026-11-04  
**Commit:** не создавался (по запросу)  
**Production / Vercel / Supabase / `.env.local`:** не изменялись

---

## Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `apps/web/lib/ai/sonogyn-chat/provider-failover.ts` | **NEW** — классификация ошибок + `shouldFailoverToNextProvider` + mock loop helper |
| `apps/web/lib/ai/sonogyn-chat/model-fallback.ts` | Реэкспорт политики; удалён узкий `isRetryableProviderError` |
| `apps/web/app/api/ai/chat/route.ts` | Failover по политике; local timeout 15s |
| `apps/web/lib/ai/sonogyn-chat/openrouter-client.ts` | Network errors → HTTP 503 + `provider` |
| `apps/web/lib/ai/gateway/resolve.ts` | Default order **cloud-first**: openrouter → perplexity → colibri |
| `apps/web/lib/ai/gateway/chat.ts` | Тот же local/cloud timeout |
| `apps/web/lib/ai/gateway/__tests__/resolve.test.ts` | Ожидания cloud-first + doctor-box order |
| `apps/web/lib/ai/sonogyn-chat/__tests__/provider-failover.test.ts` | **NEW** — 12 сценариев на моках |
| `apps/web/.env.example` | Комментарий cloud-first (не live env) |
| `scripts/colibri/wire-env.mjs` | Новые append-ключи: cloud-first order (не перезаписывает существующие) |
| `docs/ai/gateway.md` | Документация order |
| `docs/audit/colibri/11_P0_FAILOVER_PATCH.md` | Этот отчёт |

Медицинские промпты Evidence / калькуляторы / классификации — **не трогались**.

---

## Исправленное поведение

1. **Chat classic path** (`/api/ai/chat`): при ошибке провайдера вызывается `shouldFailoverToNextProvider`.  
   Retryable: сеть (`ECONNREFUSED`/`ETIMEDOUT`/…), 429, 500–504, timeout, provider 401/403 (один hop на следующего).  
   Stop: invalid_request (400/422), PHI/injection codes, нет следующего провайдера, `streamCommitted`.

2. **До стрима:** `callOpenRouterChat` завершается **до** `NextResponse(stream)`. Fallback не дублирует уже отправленные байты.

3. **Local Colibri timeout:** 180s → **15s** (`LOCAL_PROVIDER_ATTEMPT_TIMEOUT_MS`), 1 attempt.

4. **Default resolve order:** OpenRouter → Perplexity → Colibri. Colibri остаётся в цепочке при `COLIBRI_*`. Doctor-box: `LLM_FALLBACK_ORDER=colibri,openrouter,…`.

5. **Evidence:** `systemPrompt` строится один раз до цикла провайдеров — citations/контекст не зависят от vendor.

---

## Результаты тестов

```text
node --import tsx --test \
  lib/ai/sonogyn-chat/__tests__/provider-failover.test.ts \
  lib/ai/gateway/__tests__/resolve.test.ts

# tests 23
# pass 23
# fail 0
```

Покрыты требования аудита §8 (1–12) на mock providers — **без платных LLM**.

---

## Оставшиеся риски

| Риск | Статус |
|------|--------|
| Локальный `.env.local` с `LLM_FALLBACK_ORDER=colibri,…` всё ещё colibri-first | Ops: сменить вручную на cloud-first (патч env не делался) |
| AI SDK stream path: fallback только через `catch` до `return` response | OK до первого return; mid-stream error после commit — без re-request (by design) |
| Evidence double LLM (synthesis + answer) | Вне scope P0 — см. audit `06` |
| Vercel `COLIBRI_*` | NOT VERIFIED в этом прогоне |
| Health-skip Colibri без попытки | Phase 2 roadmap |

---

## Подтверждения

- [x] Production не менялся  
- [x] Vercel / Supabase не менялись  
- [x] `.env.local` / live secrets не менялись  
- [x] Модели не скачивались, Colibri не запускался  
- [x] Платных AI-запросов не было  
- [x] Commit / PR не создавались  

---

## Как безопасно включить cloud-first (ops)

В `apps/web/.env.local` (вручную):

```bash
LLM_PROVIDER=auto
LLM_FALLBACK_ORDER=openrouter,perplexity,colibri
# или временно:
# COLIBRI_ENABLED=false
```

На Vercel Production: **не** задавать `COLIBRI_BASE_URL=http://127.0.0.1:8000/v1`.  
Doctor-box: `LLM_FALLBACK_ORDER=colibri,openrouter,perplexity` + живой sidecar.

Перезапустить `next dev` после правки env.

---

## Критерий готовности P0

| Критерий | Доказательство |
|----------|----------------|
| Недоступный Colibri не ломает chat при наличии cloud | Tests 1, 3, 4 |
| Cloud получает запрос | Tests 1–2 |
| Нет бесконечных retry | Test 5 (один hit Colibri) |
| Нет retry после stream commit | Tests 9–10 |
| Evidence context / citations | Tests 11–12 |
| Security не обходится failover | Tests 7–8 |
