# 12 — P1 Medical Evidence Integrity

**Дата:** 2026-11-04  
**Статус:** реализовано (unit tests)

## Что сделано

| Артефакт | Роль |
|----------|------|
| `apps/web/lib/ai/sonogyn-chat/evidence-answer-validate.ts` | `postValidateEvidenceAnswer`, `formatEvidenceSourcedChatReply` |
| `__tests__/evidence-answer-validate.test.ts` | маркеры, PMID, URL whitelist, empty citations |
| Wiring в `app/api/ai/chat/route.ts` | single-pass + dual-LLM JSON path validation |

## Правила

1. Нет citations / insufficient → запрет выдуманных `[n]` / PMID; insufficient template.
2. Есть citations → обязательны маркеры `[1]…[n]` или блок «Источники».
3. PMID/URL вне retrieved set → fail-soft replace на sourced template.
4. System prompts Evidence **не менялись**.
5. Failover провайдера не влияет на validator (тот же `AssistantAnswer`).

## Тесты

```bash
cd apps/web && node --import tsx --test lib/ai/sonogyn-chat/__tests__/evidence-answer-validate.test.ts
# 6 pass
```

## Rollback

`EVIDENCE_CHAT_DUAL_LLM=1` — вернуть второй narrative LLM (с post-validation на non-stream JSON).
