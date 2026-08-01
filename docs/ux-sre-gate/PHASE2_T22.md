# Phase 2 · T2.2 — `exam_attempts` + RLS (2026-08-01)

**Персона:** самопроверка / экзамены · студент

## Что сделано

- Миграция `20260801140000_exam_attempts.sql` (mirror: `packages/database` + `apps/web`)
- RLS: select/insert/update/delete own; admin select если есть `is_admin()`
- Zod: `ExamAttemptUpsertSchema`, `QuizProgressSchema` в `@repo/education-quiz`
- API: `GET|POST|DELETE /api/education/exam-attempts`
- `SelfAssessmentWidget`: dual-write localStorage ↔ cloud (401 → только local)

## Схема

| Колонка | Смысл |
|---------|--------|
| `blueprint_id` | storageKey quiz-банка |
| `mode` | `self_assessment` (сейчас) / quick / certification / mock |
| `answers` | `{ questionId: correct\|incorrect }` — без PHI |
| unique | `(user_id, blueprint_id, mode)` |

## Проверка

```bash
corepack pnpm --filter @repo/education-quiz test
corepack pnpm --filter @repo/web exec tsc --noEmit
```

Prod: применить миграцию в Supabase (`ocqlsqqloqvlzutbgrnp`).

## Следующее

T2.3 — ExamEngine MCQ + image Q (история попыток certification без unique overwrite).
