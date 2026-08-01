# Phase 2 · T2.4 — AI Tutor API + Explain mode (2026-08-01)

**Персона:** студент / самопроверка · врач (обучающий режим)

## Что сделано

- Пакет `@repo/ai-tutor`: Zod request/response, rule-first Explain, LLM deepen helpers
- API `POST /api/ai/tutor` — auth, PHI gate, rate limit `aiTutor`
- Pipeline: **rule-first** всегда; **llm-explain** при `deepen=true` + `OPENROUTER_API_KEY`
- UI: `TutorExplainPanel` в SelfAssessment и результатах ExamEngine
- Режимы teach/quiz/exam/clinical_reasoning → `501` до T2.5

## Контракт (кратко)

```ts
{ mode: "explain", level, deepen?, question: { stem, options, correctIndex, explanation, ... } }
→ { answer, keyPoints, citations, followUpQuestions, whyWrong, disclaimer, meta }
```

## Env

```
OPENROUTER_API_KEY=
OPENROUTER_TUTOR_MODEL=   # optional; else OPENROUTER_ORADS_MODEL / gpt-4o-mini
```

## Проверка

```bash
corepack pnpm --filter @repo/ai-tutor test
corepack pnpm --filter @repo/web exec tsc --noEmit
```

## Следующее

T2.5 — Tutor Quiz + Exam modes → см. `PHASE2_T25.md`.
