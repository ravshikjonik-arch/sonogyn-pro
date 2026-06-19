# Анализ open-source репозиториев для SonoGyn Pro AI

> Дата: 2026-06-18 · Продукт: **PRO-only** (не публичный open API)

## Сводная таблица

| Репозиторий | Код | DICOM | BI-RADS | Плод | Локально | RU | PRO-ready |
|-------------|-----|-------|---------|------|----------|-----|-----------|
| **Echo-Alpha** | ❌ только README | — | ✅ (в статье) | ❌ | — | ❌ | ❌ |
| **USTri** | ✅ train/eval | SimpleITK | ✅ breast_* | ✅ fetal_* | ✅ GPU | ❌ | ⚠️ inference отдельно |
| **FetalAgents/FetUSAgents** | ✅ | ❌ PNG | ❌ | ✅✅ | ⚠️ 5 env | ❌ | ❌ веса не выложены |
| **Medical Imaging Diagnosis Agent** | ✅ | ⚠️ upload | ❌ | ⚠️ общий | ⚠️ Ollama/Gemini | ❌ EN | ⚠️ шаблон |
| **SonoGyn (наш worker)** | ✅ | ✅ pydicom | ✅ промпт | ✅ SonoNet | ✅ Ollama+CPU | ✅ | ✅ |

---

## 1. Echo-Alpha (MiliLab/Echo-Alpha)

**URL:** https://github.com/MiliLab/Echo-Alpha

### Стек
- В репозитории: **только README + figs/** (кода inference нет на 2026-06).
- Статья: arXiv:2604.28011 — agentic MLLM + organ-specific detectors.

### Архитектура (из paper)
1. MLLM формирует гипотезу по снимку.
2. **Tool call** → organ detector (почка 6 классов, МЖ **BI-RADS 2–5**).
3. Agent сверяет bbox/labels с глобальным видом → финальный diagnosis.
4. Обучение: SFT (9 tasks) + GRPO RL → Echo-Ground / Echo-Diag.

### Вывод для SonoGyn
- **Идея** (detect → verify → reason) — перенесена в наш `sonogyn_agents/orchestrator.py`.
- **Код/веса** — недоступны → adapter `echo_alpha_stub.py` + LLM+промпт BI-RADS для МЖ.

---

## 2. USTri (MacDunno/USTri)

**URL:** https://github.com/MacDunno/USTri · ISBI 2026

### Стек
- Python 3.10, PyTorch, CUDA 12.1
- albumentations, opencv, pandas, SimpleITK, segmentation-models-pytorch

### Зависимости (из README)
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
pip install albumentations opencv-python pandas numpy tqdm scikit-learn SimpleITK
pip install tensorboard segmentation-models-pytorch
```

### Архитектура
- **USGen** — universal backbone (Stage I `train.py`).
- **USpec** — frozen backbone + task heads (`train_phase2_single_dataset.py --task-id …`).
- **USAgent** — orchestration + structured reports (paper; inference glue в коде ограничен).

### Задачи релевантные SonoGyn
`fetal_plane_cls`, `fetal_femur`, `breast_2cls`, `breast_3cls`, `IUGC`, `FUGC`.

### Веса
- `USpec.pth` — Google Drive (README).
- Нужен FMC UIA dataset format.

### Вывод
- Лучший **CNN-бэкенд** для плода/МЖ при наличии GPU.
- Интеграция: `USTRI_PATH` + `USpec.pth` → adapter (см. `adapters/ustri_adapter.py`).

---

## 3. FetUSAgents / FetalAgents

**FetalAgents:** https://github.com/hu2274898/FetalAgents  
**FetUSAgents** (новее): код заявлен в paper; публичный clone ≈ FetalAgents.

### Стек
```
autogen-agentchat, autogen-ext[openai], Pillow, opencv, pandas, torch, timm, transformers, monai, nnunetv2
```

### Архитектура
- **Coordinator** (AutoGen) → маршрутизация VQA / report / video.
- **Expert agents** → external_tools (FetalCLIP, USFM, CSM-HC, UPerNet, …).
- **Summarizer** + RAG (WHO/ISUOG) + DPEA arbitration.

### Запуск (когда есть веса)
```bash
python main.py --inquiry "Estimate gestational age" --case_dir example_images/brain_thalamic
```

### Блокеры
- **Model weights not released** (README).
- 5+ conda environments.
- OpenAI API для LLM-агентов.
- Вход: PNG + `pixel_size.csv`, не DICOM.

### Вывод
- Roadmap adapter `fetal_agents_adapter.py` при `FETAL_AGENTS_PATH` + весах.
- Сейчас: **SonoNet** (открытые веса) + LLM на русском.

---

## 4. Medical Imaging Diagnosis Agent (AzaRKazar)

**URL:** https://github.com/AzaRKazar/medical-imaging-diagnosis-agent

### Стек
```
streamlit==1.40.2, agno, Pillow, duckduckgo-search, google-generativeai
```

### Архитектура
- Streamlit UI → **Agno Agent** + **Gemini 2.0 Flash** (+ DuckDuckGo search).
- Один monolithic prompt (5 секций markdown).
- DICOM: accept в uploader, но **без pydicom decode** (PIL.open).

### Локальный режим
- README упоминает Ollama/LLaVA — в main branch **не реализовано** (только Gemini).

### Вывод
- Взяли **паттерн UI** → наш `streamlit_app.py`.
- Добавили **Ollama backend** + **PRO gate** + structured JSON RU.

---

## 5. Выбор для SonoGyn Pro (PRO monetization)

### Базовый слой (сейчас, CPU-friendly)
| Модуль | Источник идеи | Реализация |
|--------|---------------|------------|
| DICOM | Med Imaging Agent + pydicom | `dicom_io.py` |
| Плоскости плода | SonoNet (открыты) | `sononet_infer.py` |
| Отчёт RU | Echo-Alpha loop + наш промпт | `sonogyn_agents/` |
| BI-RADS / O-RADS | Echo-Alpha + SonoGyn калькуляторы | `breast_agent.py`, `gyn_agent.py` |
| UI | AzaRKazar Streamlit | `streamlit_app.py` |

### PRO-слой (платный)
- Доступ только с `subscription_tier=pro` или активным trial (Supabase).
- Next.js `/api/ai/analyze` → worker с secret.
- Streamlit → PRO license key или Supabase JWT.

### GPU-слой (Phase 2)
- USTri `breast_3cls`, `fetal_plane_cls` при `USTRI_PATH`.
- FetalAgents при релизе весов.

---

## Лицензии и дисклеймер

Все модули — **CDS-черновик**, не медизделие. Заключение — за врачом. PHI не уходит в облако при `backend=ollama`.
