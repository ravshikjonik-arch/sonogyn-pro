# 15 — Ops + Smoke (2026-11-04)

## Ops

| Шаг | Результат |
|-----|-----------|
| `.env.local` `LLM_FALLBACK_ORDER` | **cloud-first** `openrouter,perplexity,colibri` (было colibri-first) |
| `COLIBRI_ENABLED` | `true` (оставлен; order cloud-first) |
| `.env.local` в git | **не** коммитился |
| Vercel env names | MCP 403 — нужен SSO: см. ссылку authorize в чате; CLI hung/failed network |

## Smoke

| Проверка | Результат |
|----------|-----------|
| Unit failover + evidence + resolve | **34 pass** |
| P3 structural | **18 pass** |
| Prod `/api/health` | **200** `ok` |
| Local Next `:3000` | down (не поднимали) |
| Colibri `:8000` | down (ожидаемо) |

## Рекомендация после SSO Vercel

Проверить отсутствие `COLIBRI_BASE_URL=http://127.0.0.1…` и colibri-first `LLM_FALLBACK_ORDER` на Production.
