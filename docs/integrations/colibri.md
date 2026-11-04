# Colibri ↔ SonoGyn Pro

Локальный inference ([JustVugg/colibri](https://github.com/JustVugg/colibri)) как **sidecar**.  
Структура в monorepo: [`integrations/colibri/README.md`](../../integrations/colibri/README.md) + `scripts/colibri/*`.

**Не** копировать Colibri внутрь git SonoGyn. Prod Vercel → только cloud LLM.

## Зачем

- Evidence / chat на машине врача без облака (когда sidecar up).
- Gateway default: `openrouter → perplexity → colibri` (cloud-first; doctor-box может поставить Colibri первым через `LLM_FALLBACK_ORDER`).
- Этап 5 roadmap: снижение зависимости от платных API.

## Быстрый путь (логичный ум)

```bash
# 1) Sidecar установлен в ~/colibri (уже есть у фаундера)
# 2) Env в web
pnpm colibri:wire

# 3) Первый раз — скачать модель (~20+ GB) и поднять сервер
pnpm colibri:setup
# дальше только:
pnpm colibri:start

# 4) Проверка
pnpm colibri:status
pnpm colibri:check
# + Next: GET /api/ai/gateway/status?purpose=evidence
```

`COLIBRI_HOME` — если Colibri не в `~/colibri`.

Модель по умолчанию: `qwen36-35b` (каталог Colibri, fits Mac с ~20 GB RAM).  
Другая: `COLIBRI_SETUP_MODEL=qwen3-coder-30b pnpm colibri:setup`.

## Env (`apps/web/.env.local`)

```bash
COLIBRI_ENABLED=true
COLIBRI_BASE_URL=http://127.0.0.1:8000/v1
COLIBRI_MODEL=qwen36-35b
COLIBRI_API_KEY=colibri-local
LLM_PROVIDER=auto
LLM_FALLBACK_ORDER=openrouter,perplexity,colibri
```

Опционально: `COLIBRI_EVIDENCE_MODEL`, `COLIBRI_VISION_MODEL` (vision иначе → OpenRouter).

## Ограничения

| Среда | Colibri |
|-------|---------|
| `next dev` на том же Mac | ✅ |
| Vercel Production | ❌ localhost недоступен → cloud |
| Без скачанной модели | `coli status` → not set up |

## Клинический дисклеймер

Ответ Colibri — CDS, **не диагноз**. Evidence mode обязан цитировать источники / insufficient.

См. также: `docs/ai/gateway.md`.
