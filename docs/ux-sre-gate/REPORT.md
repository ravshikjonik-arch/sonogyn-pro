# SRE Gate — A1–A3 (2026-08-01)

**Персона:** врач-практик  
**Цель:** включить Structured Reporting на prod Supabase.

## A1 — миграция prod

Применено через Supabase MCP `apply_migration` → `structured_reports_sre_t13` на `ocqlsqqloqvlzutbgrnp`.

| Таблица | RLS | Строки |
|--------|-----|--------|
| `report_templates` | ✅ | 1 (`adnex-orads-v1`) |
| `structured_reports` | ✅ | 0 |
| `report_citation_links` | ✅ | 0 |

SQL-источник: `apps/web/supabase/migrations/20260623120000_structured_reports.sql`

## A2 — smoke

| Проверка | Результат |
|----------|-----------|
| `GET /api/reports/templates` (local → prod DB) | ✅ 200, seed `adnex-orads-v1` |
| `POST /api/reports/generate` preview | ✅ 200, description/impression/recommendations + 6 citations |
| Persist draft / finalize под сессией врача | ⏳ вручную: войти → `/tools/calc/rads/adnex-report` → сохранить |

Без сессии curl на prod даёт 403 (bot/auth) — ожидаемо.

## A3 — IDOR harden

`POST /api/reports`: перед persist проверяются `assertStudyOwnedByUser` / `assertPatientOwnedByUser`, если переданы `studyId` / `patientId`.

## Следующий шаг

A2 persist под вашим логином, затем **T1.4 polish / thyroid+obstetric seed** по желанию.
