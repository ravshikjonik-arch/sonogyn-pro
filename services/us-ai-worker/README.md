# SonoGyn US AI Worker + PRO Agents

Модульная платформа ИИ для УЗИ (плод, МЖ BI-RADS, гинекология O-RADS, почки).  
**PRO-only** — доступ через Next.js entitlement или license key.

## Архитектура

```
streamlit_app.py / Next.js API
        ↓
analyzer.py → sonogyn_agents/orchestrator.py
        ├── dicom_io (DICOM→PNG)
        ├── sononet_infer (плоскости плода)
        ├── adapters/ (Echo-Alpha, USTri, FetalAgents — опционально)
        └── backends/ (Ollama локально | OpenRouter облако)
```

Документация:
- [docs/REPO_ANALYSIS.md](docs/REPO_ANALYSIS.md) — разбор Echo-Alpha, USTri, FetUSAgents, AzaRKazar
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel + Railway, без torch на edge

## Быстрый старт (API worker)

```bash
cd services/us-ai-worker
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# SonoNet (опционально, для плода)
bash scripts/setup-sononet-weights.sh
python scripts/test_sononet_e2e.py   # smoke после установки torch

cat > .env <<'EOF'
US_AI_WORKER_SECRET=dev-local-secret
SONOGYN_PRO_DEV_BYPASS=1
OPENROUTER_API_KEY=sk-or-...
US_VISION_MODEL=openai/gpt-4o-mini
# Локально без облака:
# OLLAMA_BASE_URL=http://127.0.0.1:11434
# OLLAMA_VISION_MODEL=llava:13b
# US_VISION_BACKEND=ollama
EOF

set -a && source .env && set +a
uvicorn main:app --host 0.0.0.0 --port 8090 --reload
```

## Streamlit (PRO demo)

```bash
source .venv/bin/activate && set -a && source .env && set +a
streamlit run streamlit_app.py --server.port 8501
```

Sidebar: PRO license key (`SONOGYN_PRO_KEYS=key1,key2`) или Supabase JWT.

## API

`GET /health`  
`POST /analyze` — один кейс  
`POST /analyze/batch` — массив `studies[]`

Authorization: `Bearer <US_AI_WORKER_SECRET>`

```json
{
  "domain": "breast",
  "clinicalContext": "Узелок правой МЖ, 45 лет",
  "backend": "auto",
  "frames": [{
    "mediaId": "1",
    "fileName": "breast.dcm",
    "mediaType": "dicom",
    "dataBase64": "..."
  }]
}
```

Ответ: `studySummary`, `impression`, `recommendations`, `scorecard` (BI-RADS/O-RADS), `frames[]`, `reportMarkdown`.

## Интеграция с Next.js (PRO)

`apps/web/.env.local`:

```env
US_AI_WORKER_URL=http://127.0.0.1:8090
US_AI_WORKER_SECRET=dev-local-secret
```

Маршрут `/api/ai/analyze` уже проверяет `hasProEntitlement()` — worker доверяет service secret.

## Опциональные внешние модели

| Env | Репозиторий |
|-----|-------------|
| `USTRI_PATH` + `USpec.pth` | MacDunno/USTri |
| `FETAL_AGENTS_PATH` | hu2274898/FetalAgents |
| `ECHO_ALPHA_PATH` | MiliLab/Echo-Alpha (код inference пока отсутствует) |

## Деплой (Railway + Vercel)

```bash
node scripts/setup-production.mjs   # секрет + чеклист
```

Railway: Root Directory `services/us-ai-worker` → Variables → Public URL.  
Vercel: `US_AI_WORKER_URL` + тот же `US_AI_WORKER_SECRET` → `node apps/web/scripts/sync-vercel-env.mjs`

Подробно: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · CI: `.github/workflows/us-ai-worker.yml`

## Docker локально

```bash
docker compose up --build
```

## Дисклеймер

CDS-черновик, не медизделие. Не диагноз — интерпретация за врачом.
