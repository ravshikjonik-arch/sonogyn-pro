# US AI Worker — решение инцидента (2026-10-22)

## Симптомы

- Railway: **Trial expired**, оплата Hobby падает (Stripe `pk_live` expired)
- `curl …/health` → **404 Application not found**
- PRO на сайте: DICOM/SonoNet недоступны; JPEG/PNG должны идти через **OpenRouter на Vercel**

## Уже сделано (автоматически / в репо)

| Шаг | Статус |
|-----|--------|
| Ротация `US_AI_WORKER_SECRET` → Vercel prod + preview | ✅ |
| Ротация `OPENROUTER_API_KEY` → Vercel prod + preview + redeploy | ✅ |
| Railway Variables (user) | ✅ |
| Fallback: health probe + OpenRouter без зависания на мёртвом worker | ✅ код |
| Plan B: Fly (`fly.toml`, `FLY-DEPLOY-RU.md`, CI workflow) | ✅ |
| Fly prod: `https://sonogyn-us-ai.fly.dev`, Vercel `US_AI_WORKER_URL`, worker-status `available: true` | ✅ 2026-10-22 |
| GitHub `FLY_API_TOKEN` (org token при SSO), workflow green | ✅ |
| Масштаб 100–1000 | `docs/architecture/US-AI-SCALE-100-1000.md` |

## Сделать сейчас (выбери один путь worker)

### Путь A — Railway (если оплата прошла)

1. Hobby оплачен → **Deployments → Redeploy**
2. `curl -sS https://sonogyn-us-ai-production.up.railway.app/health`
3. Vercel `US_AI_WORKER_URL` без изменений (если тот же домен)

### Путь B — Fly (**текущий prod**, Railway billing сломан)

1. Worker: **https://sonogyn-us-ai.fly.dev** — `/health` ok
2. Vercel **US_AI_WORKER_URL** уже на Fly; при смене URL — redeploy Production
3. Повторный деплoy: Actions **US AI Worker (Fly)** или [FLY-DEPLOY-RU.md](./FLY-DEPLOY-RU.md)

### Путь C — только Vercel (временно, без DICOM)

1. Vercel → `US_AI_WORKER_ENABLED=false` **или** удалить `US_AI_WORKER_URL`
2. Redeploy
3. PRO работает для **JPEG/PNG** через OpenRouter; DICOM — экспорт в PNG или ждать worker

## После восстановления worker

1. OpenRouter: revoke старые ключи
2. GitHub: новый `RAILWAY_TOKEN` (если CI Railway)
3. Smoke: PRO-кейс JPEG + PRO-кейс DICOM
4. `US_AI_WORKER_ENABLED` вернуть `true` (или убрать переменную)

## OpenRouter

Лимит $ на ключе, мониторинг: https://openrouter.ai/activity
