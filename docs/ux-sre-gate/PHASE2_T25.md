# Phase 2 · T2.5 — Tutor Quiz + Exam modes (2026-08-01)

**Персона:** студент / самопроверка

## Что сделано

- `@repo/ai-tutor`: `buildTutorQuizExam` + Zod (quiz/exam)
- `POST /api/ai/tutor` modes: `explain` | `quiz` | `exam`
- UI `TutorQuizExamLauncher` → собирает сессию и запускает `ExamEngineWidget`
- Точка входа: `/tools/refs/fetal-anatomy-22-views` → Quiz

## Граница

| В scope | Вне |
|---------|-----|
| Rule-first выбор из банка | Генерация новых MCQ LLM |
| Quiz (без таймера) / Exam (таймер) | Teach / clinical_reasoning |

## Следующее

T2.6 — Daily challenge cron + UI.
