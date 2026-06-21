# Деплой SonoGyn US AI (PRO)

## Архитектура

```
Пользователь PRO
    → Vercel (Next.js) — auth, PRO gate, /api/ai/analyze
    → Railway (us-ai-worker) — DICOM, SonoNet, OpenRouter vision
    → Supabase — case_media, ai_analyses
```

---

## Шаг 1. Railway (Python worker)

### A. Через UI (первый раз)

1. [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo**
2. Выберите репозиторий SonoGyn Pro
3. **Settings → Root Directory:** `services/us-ai-worker`
4. Railway подхватит `railway.json` + `Dockerfile`
5. **Variables** (Settings → Variables):

| Variable | Пример | Обязательно |
|----------|--------|-------------|
| `US_AI_WORKER_SECRET` | `node scripts/setup-production.mjs` | ✅ |
| `OPENROUTER_API_KEY` | `sk-or-...` | ✅ для LLM |
| `US_VISION_MODEL` | `openai/gpt-4o-mini` | ✅ |
| `US_VISION_BACKEND` | `openrouter` | рекомендуется |
| `US_AI_WORKER_REFERER` | `https://sonogyn-pro-web-....vercel.app` | опционально |
| `USTRI_PATH` | `/app/ustri` (в Docker автоматически) | опционально |
| `USTRI_USPEC_WEIGHTS` | `/app/ustri/USpec.pth` | опционально |
| `INSTALL_USTRI` | `0` — пропустить USTri при сборке | только build-arg |

6. **Settings → Networking → Generate Domain** → скопируйте URL  
   Пример: `https://sonogyn-us-ai-production.up.railway.app`

7. Smoke:
```bash
curl -s https://YOUR-URL.up.railway.app/health | python3 -m json.tool
# sononet: true, ustri: true, visionBackend: "openai/gpt-4o-mini"
```

### B. CLI (повторные деплои)

```bash
npm i -g @railway/cli
railway login
cd services/us-ai-worker
railway link
railway up
```

### C. GitHub Actions (auto-redeploy)

Secrets в GitHub → Settings → Secrets:

| Secret | Где взять |
|--------|-----------|
| `RAILWAY_TOKEN` | Railway → Account → Tokens |
| `RAILWAY_SERVICE_ID` | Service → Settings → ID |

Push в `main` → workflow `.github/workflows/us-ai-worker.yml`  
Собирает Docker + `railway redeploy`.

---

## Шаг 2. Vercel (Next.js)

### Локально подготовить `.env.local`

```env
US_AI_WORKER_URL=https://YOUR-URL.up.railway.app
US_AI_WORKER_SECRET=<тот же что на Railway>
OPENROUTER_US_VISION_MODEL=openai/gpt-4o-mini
```

### Синхронизация на Vercel

```bash
cd apps/web
node scripts/sync-vercel-env.mjs
```

Или вручную: Vercel → Project → Settings → Environment Variables.

### Redeploy

Vercel → Deployments → Redeploy (Production).

---

## Шаг 3. Проверка PRO-пайплайна

1. Войти как PRO-пользователь на production URL
2. Открыть кейс с DICOM/PNG
3. «Запустить (PRO)» → дождаться результата
4. Ожидается: badge **SonoNet**, pipeline `us-ai-worker+...`, кнопка **Отчёт .md**

---

## Почему не Vercel для worker

| | Vercel | Railway |
|---|--------|---------|
| PyTorch + SonoNet ~300MB | ❌ | ✅ |
| Timeout > 60s | ⚠️ | ✅ |
| DICOM pydicom | ⚠️ | ✅ |

---

## Локальная разработка

```bash
cd services/us-ai-worker
docker compose up --build
# или: uvicorn main:app --port 8090
```

`apps/web/.env.local`:
```env
US_AI_WORKER_URL=http://127.0.0.1:8090
US_AI_WORKER_SECRET=dev
```

---

## Ollama (on-prem, без облачного LLM)

```bash
docker compose --profile local-llm up
# US_VISION_BACKEND=ollama, OLLAMA_VISION_MODEL=llava:13b
```

---

## Troubleshooting

| Симптом | Решение |
|---------|---------|
| `sononet: false` на /health | Weights не скачались — пересобрать Docker |
| `ustri: false` на /health | `INSTALL_USTRI=0` или сбой gdown — логи `setup-ustri.sh` |
| Worker 401 | `US_AI_WORKER_SECRET` не совпадает Vercel ↔ Railway |
| Только SonoNet, без текста | Добавить `OPENROUTER_API_KEY` на Railway |
| DICOM не декодируется | Проверить pylibjpeg в логах контейнера |

---

## Быстрый чеклист

```bash
node services/us-ai-worker/scripts/setup-production.mjs
```
