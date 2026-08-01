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
| Persist draft → finalize → GET (Bearer smoke) | ✅ `node scripts/sre-persist-smoke.mjs` |

Автономный smoke: magic-link JWT → `POST /api/reports` → `PATCH finalized` → `GET` + проверка строк в БД.

## A3 — IDOR harden

`POST /api/reports`: перед persist проверяются `assertStudyOwnedByUser` / `assertPatientOwnedByUser`, если переданы `studyId` / `patientId`.

## Фиксы по пути smoke

- Bearer JWT → PostgREST: `utils/supabase/user-scoped.ts` (иначе RLS insert/select без cookie ломался).
- Чтение отчёта: sanitize невалидных `citations[].url` из output_json.

## Следующий шаг

Seed thyroid/obstetric templates **или** polish UI T1.4 — по выбору.
