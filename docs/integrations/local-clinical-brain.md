# Локальный клинический мозг (Clinical Brain)

Страница: **`/ai/consultants/brain`**. Два режима:

| Режим | Где считается | Нужен интернет |
|--------|----------------|----------------|
| **Локальный мозг** | Браузер (`ClinicalBrain` + `knowledge-bus`) | Нет |
| **+ LLM (Ollama)** | `POST /api/ai/brain` mode `llm` → слоты; числа — движки | Только localhost |
| **+ Evidence** | `POST /api/ai/brain` `evidence: true` → полный retrieval **или** tier `registry` (стандарты FIGO/O-RADS без PubMed после расчёта) | Частично |

**Не путать с Colibri** (`pnpm colibri:*`) — тот питает общий AI Gateway; clinical brain — отдельный продуктовый ассистент с детерминированными калькуляторами и цитатами FMF/FIGO.

## Быстрый старт (без Ollama)

```bash
pnpm install:deps
pnpm dev:web
# http://localhost:3000/ai/consultants/brain
# Режим «Локальный мозг» — примеры: «КТР 63», «NT 1.8 при КТР 63», «миома интрамуральная»
```

Проверка API (Next должен быть запущен):

```bash
pnpm brain:check
# с сетью и поднятым dev:web — полный evidence-smoke:
SONOGYN_BRAIN_EVIDENCE=1 pnpm brain:check
pnpm brain:verify
# скорость + intent: локальные расчёты обычно &lt; 50 ms; полный evidence 10–30 с (сеть)
```

## Ollama (опционально, режим LLM)

```bash
# macOS: ollama.com или brew install ollama
ollama serve
ollama pull qwen3:4b
```

В `apps/web/.env.local`:

```bash
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:4b
```

Перезапустить `pnpm dev:web`. На странице индикатор Ollama станет зелёным; переключатель **«+ LLM (Ollama)»** включит серверный слот-парсер с откатом на детерминированный мозг при сбое.

## API

- `GET /api/ai/brain` → `{ ollama, models?, model, evidenceCapable }`
- `POST /api/ai/brain` → `{ text, session?, mode?, evidence?, useLlmEvidence?, corpusMode? }`
  - При `evidence: true` после движка подмешиваются цитаты PubMed/Europe PMC/КР/vault и подсказки из `international-standards.json` (rate limit как Evidence Assistant).

Код: `apps/web/lib/edge/brain-server.ts`, `apps/web/lib/ai/clinical-copilot/orchestrator.ts`, `packages/edge-llm`, `packages/medical-calculations` (`clinicalBrain`), `packages/evidence-retrieval`.

## Дисклеймер

Вывод справочный; клиническое решение принимает врач. На Vercel production Ollama недоступен — работает только облачный стек других консультантов; brain на prod без LLM-режима считает движки на клиенте при открытии страницы.