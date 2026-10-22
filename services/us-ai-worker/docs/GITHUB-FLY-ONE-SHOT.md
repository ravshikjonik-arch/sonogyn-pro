# Fly worker через GitHub (без fly login на Mac)

## 1. Fly.io в браузере

1. [fly.io](https://fly.io) → Sign up (GitHub/Google).
2. [Access Tokens](https://fly.io/user/personal_access_tokens) → **Create token** → скопировать (один раз).

## 2. GitHub Secrets

Repo: `ravshikjonik-arch/sonogyn-pro` → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Значение |
|--------|----------|
| `FLY_API_TOKEN` | токен Fly |
| `US_AI_WORKER_SECRET` | из `.tmp/railway-rotation-2026-10-22.txt` (после `=`) |
| `OPENROUTER_API_KEY` | `sk-or-v1-…` (тот же, что Vercel) |
| `FLY_APP_NAME` | опционально: `sonogyn-us-ai` |

## 3. Запуск деплоя

**Actions** → **US AI Worker (Fly)** → **Run workflow** → branch `main`.

Или CLI:

```bash
gh workflow run "US AI Worker (Fly)" --ref main
```

## 4. После green job

1. В summary job — **URL** `https://….fly.dev`
2. Vercel → `US_AI_WORKER_URL` = этот URL (production + preview)
3. Redeploy Vercel Production
4. Проверка: `https://sonogyn-pro.ru/api/ai/worker-status` → `"available": true`
