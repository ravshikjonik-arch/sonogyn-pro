# ИИ без VPN (волна 0)

## Цель

Chat, Evidence synthesis, O-RADS assist — **не зависят** от доступности openrouter.ai / perplexity.ai в браузере врача.

## Порядок fallback (Vercel env)

```env
COLIBRI_ENABLED=true
COLIBRI_BASE_URL=https://llm.sonogyn-pro.ru/v1
COLIBRI_API_KEY=<длинный_секрет>
LLM_FALLBACK_ORDER=colibri,openrouter,perplexity
```

Colibri on **Selectel/Yandex 16 GB** — `docs/operations/colibri-vps-24x7-runbook.md`.

## Если Colibri недоступен

- Evidence: rules-only ответ (`synthesize-llm` fallback).
- Калькуляторы: без изменений (локальные).
- Чат: сообщить пользователю «облачный ИИ временно недоступен».

## Проверка

```bash
COLIBRI_BASE_URL=https://llm.sonogyn-pro.ru/v1 pnpm colibri:check
curl -s https://sonogyn-pro.ru/api/ai/gateway/status
```

## Vision (O-RADS фото)

Пока OpenRouter vision; волна 3 — worker ближе к РФ или colocated с Colibri.