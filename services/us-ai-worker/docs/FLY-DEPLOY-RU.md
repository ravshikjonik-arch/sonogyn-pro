# Fly.io — US AI Worker (plan B, если Railway недоступен)

Один Docker-образ, тот же контракт, что Railway. Vercel меняет только `US_AI_WORKER_URL`.

## 1. Установка CLI

```bash
curl -L https://fly.io/install.sh | sh
# или: brew install flyctl
fly auth login
```

## 2. Первый деплой

```bash
cd services/us-ai-worker
cp fly.toml.example fly.toml   # если fly.toml ещё нет
fly launch --no-deploy --copy-config --name sonogyn-us-ai
```

- Region: **fra** (рядом с Vercel `fra1`) или **ams**
- **Не** создавать Postgres/Redis

## 3. Secrets (те же имена, что Railway)

```bash
fly secrets set \
  US_AI_WORKER_SECRET='…из .tmp/railway-rotation-2026-10-22.txt…' \
  OPENROUTER_API_KEY='sk-or-v1-…' \
  US_VISION_MODEL='openai/gpt-4o-mini' \
  US_VISION_BACKEND='openrouter' \
  US_AI_WORKER_REFERER='https://sonogyn-pro.ru'
```

## 4. Deploy + scale

```bash
# Если Depot падает (deadline_exceeded / handshake EOF) — добавьте --buildkit
fly deploy --remote-only --buildkit --ha=false
fly scale count 2   # Phase 1 масштаба (опционально)
fly certs setup     # если нужен свой домен
```

Публичный URL: `fly status` → **Hostname** (`https://sonogyn-us-ai.fly.dev`).

## 5. Smoke

```bash
curl -sS "https://YOUR-APP.fly.dev/health" | python3 -m json.tool
```

## 6. Vercel

Settings → Environment Variables → **US_AI_WORKER_URL** = новый Fly URL (production + preview).

Redeploy Production.

Или из репо:

```bash
cd apps/web
US_AI_WORKER_URL=https://YOUR-APP.fly.dev node scripts/sync-vercel-env.mjs
```

## 7. GitHub CI (опционально)

Secrets: `FLY_API_TOKEN` (при SSO — org-токен: `fly tokens org -o personal`, см. [GITHUB-FLY-ONE-SHOT.md](./GITHUB-FLY-ONE-SHOT.md)), `FLY_APP_NAME=sonogyn-us-ai` → workflow `.github/workflows/us-ai-worker-fly.yml`.

## Стоимость (ориентир)

~$5–15/мес за 1× `2GB` machine; 2× replica — ×2. См. [US-AI-SCALE-100-1000.md](../../../docs/architecture/US-AI-SCALE-100-1000.md).
