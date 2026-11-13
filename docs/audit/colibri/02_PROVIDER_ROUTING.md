# 02 — Provider Routing

## Purpose → default chain (код)

Источник: `apps/web/lib/ai/gateway/resolve.ts` `resolveProviderChain`.

| Purpose | Default order (если нет `LLM_FALLBACK_ORDER`) | Условия включения |
|---------|-----------------------------------------------|-------------------|
| `text` | colibri → perplexity → openrouter | Colibri: enabled/model; Pplx/OR: API key |
| `evidence` | то же | Vision model не требуется |
| `vision` | openrouter → colibri | Colibri **только** при `COLIBRI_VISION_MODEL` |

`LLM_FALLBACK_ORDER` **переопределяет** порядок для auto (локально сейчас: `colibri,openrouter,perplexity`).

## Когда вызывается Colibri

`resolveColibri` возвращает кандидата если:

- `COLIBRI_ENABLED` не `false/0/off`, **и**
- (`LLM_PROVIDER=colibri`) **или** (`COLIBRI_ENABLED` true/1/on) **или** (`auto` + `COLIBRI_MODEL` set)

URL: `COLIBRI_BASE_URL` + `/chat/completions` (`colibriChatUrl`).  
Timeout в gateway/chat: **180s** local, **90s** cloud; local `maxAttempts=1`.

## Primary vs search

| Роль | Провайдер в коде | Примечание |
|------|------------------|------------|
| Evidence **retrieval** | Не LLM — adapters (`evidence-retrieval`) | PubMed, КР, NICE… |
| Evidence **synthesis** | Gateway chain | Предпочтительно Perplexity в docs; фактически order env |
| Clinical chat | Gateway chain / AI SDK | |
| Vision / O-RADS images | OpenRouter (или Colibri vision) | |

Perplexity в локальном `.env.local` **отсутствует** → в chain после Colibri идёт **OpenRouter** (если key set).

## `LLM_PROVIDER` forced

При forced `colibri|perplexity|openrouter`: primary + остальные (если не `LLM_STRICT_PROVIDER=1`).

## Health vs routing

`getGatewayStatus` (`status.ts`) пингует Colibri `/models` (2.5s).  
**Не влияет** на `resolveProviderChain` — unhealthy остаётся в chain. **RISK**.

## Схема

```text
                    ┌─ COLIBRI_ENABLED + MODEL ──► Colibri (isLocal)
Request purpose ──►│─ PERPLEXITY_API_KEY ────────► Perplexity
                    └─ OPENROUTER_API_KEY ───────► OpenRouter
                              │
                    LLM_FALLBACK_ORDER / defaults
                              │
                    Ordered ResolvedLlm[]
```

## Вывод

Маршрутизация **декларативна через env**. Colibri не hard-coded в prod, но **легко становится primary** при wire-env. Нет runtime «skip if down».
