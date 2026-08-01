# Phase 2 · T2.1 — `@repo/education-quiz` (2026-08-01)

**Персона:** самопроверка / экзамены · студент

## Что сделано

- Пакет `packages/education-quiz`: типы, Zod `QuizBankSchema`, helpers (`filter`, `stats`, `progress`)
- Web shim: `apps/web/lib/education/quiz-bank-types.ts` → re-export
- `SelfAssessmentWidget` импортирует из `@repo/education-quiz`
- Cervix self-assessment types/loader дедуплены на пакет
- Mobile `QuizPanel` использует `filterQuizQuestionsByLevel`

## Граница

| В пакете | Вне (осознанно) |
|----------|-----------------|
| Contracts + Zod + pure helpers | UI widget, topic banks JSON, localStorage |
| | `exam_attempts` → T2.2 |
| | ExamEngine image Q → T2.3 |

## Проверка

```bash
corepack pnpm --filter @repo/education-quiz typecheck
corepack pnpm --filter @repo/education-quiz test
corepack pnpm --filter @repo/cervix-pathology-reference typecheck
corepack pnpm --filter @repo/mobile typecheck
```

## Следующее

T2.2 — `exam_attempts` migration + RLS.
