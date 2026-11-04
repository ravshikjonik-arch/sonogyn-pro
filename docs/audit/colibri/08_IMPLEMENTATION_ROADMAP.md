# 08 — Implementation Roadmap

**Правило:** без кода до явного approve владельца. Ниже — план после аудита.

## Phase 0 — Ops now (без деплоя кода)

| # | Действие | Зачем |
|---|----------|-------|
| 0.1 | Не арендовать GPU | Cost |
| 0.2 | Локально: `COLIBRI_ENABLED=false` или order без colibri first | Разблокировать local chat |
| 0.3 | Проверить Vercel env names: нет COLIBRI_* / нет colibri-first order | Prod safety |
| 0.4 | Не продолжать download модели на Mac | Disk/RAM |

## Phase 1 — Failover hardening (P0)

| # | Задача | Файлы |
|---|--------|-------|
| 1.1 | Chat classic: fallback на transport/5xx/empty как gateway | `chat/route.ts`, `model-fallback.ts` |
| 1.2 | Unit tests ECONNREFUSED → next provider | `__tests__` |
| 1.3 | Align AI SDK + classic behavior | `chat/route.ts` |

## Phase 2 — Health-aware routing

| # | Задача |
|---|--------|
| 2.1 | Short-circuit skip `isLocal` if last ping failed (TTL 10–30s) |
| 2.2 | Local connect timeout 3–5s (отдельно от read timeout) |
| 2.3 | Status endpoint уже есть — переиспользовать |

## Phase 3 — Evidence cost & integrity

| # | Задача |
|---|--------|
| 3.1 | Optional single-pass Evidence (skip second LLM) |
| 3.2 | Citation marker validation on final text |
| 3.3 | Golden clinical fixtures (OB/GYN/US) |

## Phase 4 — Provider adapters

| # | Задача |
|---|--------|
| 4.1 | Migrate remaining direct OpenRouter callers to gateway |
| 4.2 | Document `OPENAI_COMPAT_*` for vLLM/SGLang |
| 4.3 | Remote Colibri runbook (VPN, auth, model pin) |

## Phase 5 — Scale toward 100k doctors

| # | Задача |
|---|--------|
| 5.1 | Accurate cost metering vs invoice |
| 5.2 | Caching Evidence search |
| 5.3 | Shared inference only if enterprise privacy requires |

**Сохранить Colibri:** да, как optional Phase 4 doctor-box — не blocker Phase 1–3.
