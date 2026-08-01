# Phase 2 · T2.3 — ExamEngine MCQ + image Q (2026-08-01)

**Персона:** самопроверка / экзамены · студент

## Что сделано

- Пакет `@repo/examination-engine`: start / answer / navigate / finish / score / timer
- `QuizQuestion.media` (image) в `@repo/education-quiz` + Zod
- 6 image-MCQ в fetal anatomy quiz bank (локальные SVG атласа)
- Web `ExamEngineWidget` на `/tools/refs/fetal-anatomy-22-views` (вкладка Quiz)
- Миграция `20260801150000_exam_attempts_history`: history для quick/certification/mock; self_assessment — одна строка
- API: self_assessment update-or-insert; остальные modes — append

## Граница

| В scope | Вне |
|---------|-----|
| Quick / certification / mock MCQ + image | Mobile QuizPanel parity |
| Учебные схемы атласа | Patient/case images |
| Append history attempts | `exam_certificates`, proctoring |

## Проверка

```bash
corepack pnpm --filter @repo/education-quiz test
corepack pnpm --filter @repo/examination-engine test
corepack pnpm --filter @repo/web exec tsc --noEmit
```

## Следующее

T2.4 — AI Tutor API + Explain mode → см. `PHASE2_T24.md`.
