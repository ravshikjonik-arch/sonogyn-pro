# Colibri ↔ SonoGyn Pro

Локальный LLM-sidecar. **Не** vendored в monorepo — живёт рядом: `~/colibri` (или `COLIBRI_HOME`).

## Роль в продукте

| Слой | Где |
|------|-----|
| Inference | Colibri OpenAI API `http://127.0.0.1:8000/v1` |
| Маршрутизация | SonoGyn AI Gateway (`apps/web/lib/ai/gateway`) |
| Prod Vercel | Colibri **недоступен** (localhost) → OpenRouter/Perplexity |
| Локальный врач / doctor box | Colibri first, cloud failover |

## Команды (из корня monorepo)

```bash
pnpm colibri:status    # coli status + ping :8000
pnpm colibri:setup     # coli setup -y (скачает модель, ~20+ GB)
pnpm colibri:start     # coli start (если setup уже был)
pnpm colibri:stop      # coli stop
pnpm colibri:wire      # дописать COLIBRI_* в apps/web/.env.local
pnpm colibri:check     # ping sidecar + подсказка gateway/status
```

## Env (apps/web/.env.local)

См. `apps/web/.env.example` и `docs/integrations/colibri.md`.

Минимум:

```bash
COLIBRI_ENABLED=true
COLIBRI_BASE_URL=http://127.0.0.1:8000/v1
COLIBRI_MODEL=qwen36-35b
COLIBRI_API_KEY=colibri-local
LLM_PROVIDER=auto
LLM_FALLBACK_ORDER=openrouter,perplexity,colibri
# doctor-box: LLM_FALLBACK_ORDER=colibri,openrouter,perplexity
```

## Проверка

1. Colibri dashboard: http://127.0.0.1:8000/  
2. `curl -s http://127.0.0.1:8000/v1/models`  
3. SonoGyn: `GET http://localhost:3000/api/ai/gateway/status?purpose=evidence`

CDS: ответ модели ≠ диагноз; Evidence цитирует источники отдельно.
