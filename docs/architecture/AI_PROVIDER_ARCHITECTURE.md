# AI Provider Architecture (SonoGyn Pro)

**Соответствует коду:** `apps/web/lib/ai/gateway/*`, `sonogyn-chat/provider-failover.ts`  
**Дата сверки:** 2026-11-05

## Целевая production-схема

```text
Врач → (Cloudflare DNS/WAF optional) → Vercel Next.js API
                                         ├─ OpenRouter      (primary)
                                         ├─ Perplexity      (failover / evidence text)
                                         └─ Colibri         (optional; OFF by default)
                                         └─ Supabase        (auth, quota, event meta)
```

Colibri **не** размещается в Cloudflare Workers / Workers AI / R2. См. `docs/audit/COLIBRI_CLOUDFLARE_COMPATIBILITY.md`.

## Провайдеры

| ID | Роль | Включение |
|----|------|-----------|
| `openrouter` | Основной cloud LLM / vision | `OPENROUTER_API_KEY` |
| `perplexity` | Text / sonar (не vision) | `PERPLEXITY_API_KEY` |
| `colibri` | Private local/remote OpenAI-compatible | **`COLIBRI_ENABLED=true`** (+ model) или `LLM_PROVIDER=colibri` |

Порядок по умолчанию: **openrouter → perplexity → colibri**.  
Override: `LLM_FALLBACK_ORDER` (Colibri в списке **игнорируется**, пока не enabled).

## Ключевые модули

| Модуль | Файл |
|--------|------|
| Resolve chain | `lib/ai/gateway/resolve.ts` (`isColibriEnabled`) |
| Completion + failover | `lib/ai/gateway/chat.ts` |
| Chat HTTP attempts | `app/api/ai/chat/route.ts` + `provider-failover.ts` |
| Status (ops) | `GET /api/ai/gateway/status` — Colibri ping **только если enabled** |
| Cost telemetry | `lib/ai/gateway/cost.ts` (без текста запросов) |

## Timeouts

| Provider class | Timeout | Retries |
|----------------|---------|---------|
| Local (`isLocal`, Colibri) | 15 s | 1 |
| Cloud | 90 s | до 2 |

## Клиент

Клиентское приложение **не** переключается при вкл/выкл Colibri — только server env. Нет `NEXT_PUBLIC_*` для API keys провайдеров.

## Включить Colibri (doctor-box)

```bash
COLIBRI_ENABLED=true
COLIBRI_BASE_URL=http://127.0.0.1:8000/v1
COLIBRI_MODEL=qwen36-35b
COLIBRI_API_KEY=colibri-local
# optional: LLM_FALLBACK_ORDER=colibri,openrouter,perplexity
```

## Отключить Colibri (production)

```bash
COLIBRI_ENABLED=false
# или удалить COLIBRI_ENABLED / не задавать
# не задавать COLIBRI_BASE_URL=http://127.0.0.1 на Vercel
```

Runbook: `docs/operations/AI_FAILOVER_RUNBOOK.md`.
