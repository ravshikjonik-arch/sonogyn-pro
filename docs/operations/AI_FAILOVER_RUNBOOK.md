# AI Failover Runbook

## Симптомы

| Симптом | Вероятная причина | Действие |
|---------|-------------------|----------|
| Chat 503 / all_providers_failed | Нет ключей OpenRouter/Perplexity | Проверить Vercel env (имена, не значения в чат) |
| Долгий ответ ~15s затем cloud | Colibri enabled + sidecar down и стоит раньше cloud | `COLIBRI_ENABLED=false` на prod; doctor-box — поднять `coli start` |
| localhost errors в логах Vercel | `COLIBRI_BASE_URL=127.0.0.1` + enabled | Убрать URL / выключить Colibri |
| Vision не работает | Нет OpenRouter / нет COLIBRI_VISION_MODEL | Задать `OPENROUTER_API_KEY` |

## Диагностика (без PHI)

```bash
# Local / staging
curl -sS "$APP_URL/api/ai/gateway/status?purpose=text" | jq .
# Смотреть: providers[].id, configured, healthy, detail — не логировать тела чатов
```

Unit failover:

```bash
cd apps/web
node --import tsx --test \
  lib/ai/sonogyn-chat/__tests__/provider-failover.test.ts \
  lib/ai/gateway/__tests__/resolve.test.ts
```

## Политика failover (код)

- Retryable → следующий провайдер: сеть, 429, 500–504, timeout, provider 401/403.
- Stop: PHI/injection, invalid_request 400/422, stream уже начат.
- Нет циклов; нет параллельного fan-out.
- Colibri **не вызывается**, если `COLIBRI_ENABLED` off.

## Вкл / выкл Colibri

**Выкл (рекомендуется production):**

- `COLIBRI_ENABLED=false` или unset  
- Не требует деплоя клиента  

**Вкл (локально / VPS с моделью):**

- `COLIBRI_ENABLED=true`  
- `COLIBRI_MODEL=…`  
- Достижимый `COLIBRI_BASE_URL` (не 127.0.0.1 с Vercel)  
- `pnpm colibri:check` на машине sidecar  

## Инцидент: все провайдеры down

1. Status endpoint → какие keys missing / unhealthy.  
2. OpenRouter / Perplexity dashboards.  
3. Не включать Colibri «вслепую» на Vercel с localhost.  
4. Сообщение врачу: «AI временно недоступен» — без деталей инфраструктуры клиенту.

## Стоимость / метрики (без медтекста)

- `estimateGatewayCostUsd` + doctor daily limits (`AI_DOCTOR_DAILY_*`).  
- Логировать: provider, status, latency, tokens, estimated USD — **не** prompt/response body.  
- `logAiChatEvent` — метаданные only.
