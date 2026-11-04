# 13 — P2 Cost & Performance

**Дата:** 2026-11-04  
**Статус:** реализовано (default single-pass)

## Изменения

| Тема | Решение |
|------|---------|
| Double LLM | **По умолчанию отключён** второй narrative LLM в Evidence chat |
| Opt-in dual | `EVIDENCE_CHAT_DUAL_LLM=1` |
| Metering | `evidenceCostModelLabel` → `ai_chat_events.model`; headers `X-Sonogyn-Evidence-Llm-Calls` |
| Кэш retrieval | Уже: `CACHE_TTL.search = 1h` + Redis wrapper `createEvidenceCacheStore` — без смены TTL (достаточно) |
| Платные бенчмарки | Не запускались |

## Метрика LLM calls / UX

| Сценарий | llmCalls |
|----------|----------|
| insufficient | 0 |
| single-pass + rules synthesis | 0 |
| single-pass + llm synthesis | 1 |
| dual + llm synthesis | 2 |

Код: `apps/web/lib/ai/sonogyn-chat/evidence-cost.ts`, early-return в `chat/route.ts`.

## Тесты

```bash
cd apps/web && node --import tsx --test lib/ai/sonogyn-chat/__tests__/evidence-cost.test.ts
```

## Риски

- UX короче (structured markdown вместо «эссе») — ожидаемо.
- Dual path streaming по-прежнему без mid-stream validation (только JSON path).
