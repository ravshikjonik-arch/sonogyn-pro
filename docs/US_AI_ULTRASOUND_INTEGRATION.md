# Интеграция ИИ-агентов УЗИ в SonoGyn Pro

## Итог

| Компонент | Путь | Назначение |
|-----------|------|------------|
| Python worker | `services/us-ai-worker/` | DICOM, SonoNet, USTri, domain agents |
| Пакетный CLI | `scripts/batch_analyze_folder.py` | Архив DICOM → CSV + RU markdown |
| Streamlit PRO UI | `services/us-ai-worker/streamlit_app.py` | Загрузка снимков, отчёт RU |
| Next.js API | `apps/web/app/api/ai/analyze/` | PRO gate для веб-приложения |
| Анализ репозиториев | `services/us-ai-worker/docs/REPO_ANALYSIS.md` | Echo-Alpha, USTri, FetUSAgents, AzaRKazar |
| Деплой | `services/us-ai-worker/docs/DEPLOYMENT.md` | Vercel + Railway |

## Монетизация (PRO-only)

1. **Web:** `hasProEntitlement()` → 402 без PRO на `/api/ai/analyze`.
2. **Worker:** доверяет `US_AI_WORKER_SECRET` (вызывает только backend Next.js).
3. **Streamlit:** `SONOGYN_PRO_KEYS` или Supabase JWT с `subscription_tier=pro`.

## Запуск за 5 минут

```bash
cd services/us-ai-worker
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export US_AI_WORKER_SECRET=dev SONOGYN_PRO_DEV_BYPASS=1
uvicorn main:app --port 8090 &
streamlit run streamlit_app.py
```

## Выбор open-source (кратко)

- **Echo-Alpha** — идея agent+detector, **кода нет** → LLM BI-RADS agent.
- **USTri** — GPU CNN (Phase 2), adapter **реализован** (`ustri_adapter.py`).
- **FetUSAgents** — веса не опубликованы → SonoNet + LLM.
- **AzaRKazar** — паттерн Streamlit; мы добавили Ollama + PRO + RU JSON.
- **ai_mri_analyzer** — паттерн batch CSV/PDF → наш `batch_archive.py` + CLI.

## Структурированный отчёт

```json
{
  "domain": "breast",
  "studySummary": "...",
  "impression": "...",
  "scorecard": "BI-RADS 4A",
  "recommendations": ["..."],
  "frames": [{ "findings": [], "birads": "4A" }],
  "reportMarkdown": "..."
}
```

## Vercel

Только Next.js. ML — Railway/Docker (`US_AI_WORKER_URL`). Подробнее: [DEPLOYMENT.md](../services/us-ai-worker/docs/DEPLOYMENT.md).
