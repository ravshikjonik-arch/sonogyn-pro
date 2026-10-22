# Fly worker через GitHub (без fly login на Mac)

## 1. Токен Fly для GitHub

**Обычный путь:** [Personal Access Tokens](https://fly.io/user/personal_access_tokens) → Create token.

**Если в UI пишут про SSO** («нельзя создать токены для учётной записи…») — нужен **org-токен**, не личный:

```bash
fly auth login   # уже залогинены — пропустить
fly orgs list    # slug организации, у worker `sonogyn-us-ai` это обычно `personal`
fly tokens org -o personal -n "github-actions-sonogyn-us-ai"
```

Скопировать выведенный токен **один раз** → GitHub secret `FLY_API_TOKEN`.

Или из Mac (без копирования в чат):

```bash
fly tokens org -o personal -n "github-actions-sonogyn-us-ai" -j \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" \
  | gh secret set FLY_API_TOKEN -R ravshikjonik-arch/sonogyn-pro
```

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
