# 14 — P3 Medical AI Evaluation

**Дата:** 2026-11-04  
**Статус:** structural soft eval (no live LLM)

## Артефакты

| Файл | Роль |
|------|------|
| `packages/evidence-retrieval/eval/golden-prompts.json` | 18 кейсов с `domain`: obstetrics / gynecology / ultrasound / safety |
| `apps/web/scripts/evidence-p3-structural-eval.ts` | empty-retrieval + validator + PMID poison check |
| `packages/evidence-retrieval/eval/run-golden-structural.mjs` | существующий soft CI на claims |

## Домены

- **obstetrics** — преэклампсия, ЗВУР, внематочная, ГСД  
- **gynecology** — FIGO, эндометриоз КР, ASC-US, СПКЯ  
- **ultrasound** — O-RADS, IOTA, BI-RADS, TI-RADS  
- **safety** — garbage query, injection, forced PMID, «окончательный диагноз»

## Запуск

```bash
# from apps/web
pnpm test:evidence-p3
# or: node --import tsx scripts/evidence-p3-structural-eval.ts

# package-level (claims)
node packages/evidence-retrieval/eval/run-golden-structural.mjs
```

Live LLM (`ALLOW_LIVE_LLM=1`) — **не** в CI; не входил в этот этап.

## Ограничения

- Empty-retrieval path: проверяет insufficient/disclaimer/validator, не клиническую «точность» с полным корпусом.
- Classification hints — soft warn при miss.
- Без PHI в фикстурах.
