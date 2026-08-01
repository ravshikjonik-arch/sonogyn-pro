# SRE Gate — Phase 1 closeout (2026-08-01)

**Персона:** врач-практик  

## Сделано по очереди

1. **A1** — миграция `structured_reports` + RLS на prod  
2. **A2/A3** — persist draft→finalize + ownership checks + Bearer JWT  
3. **Seed** — `thyroid-tirads-v1`, `obstetric-biometry-v1` в `report_templates`  
4. **UX** — hub `/reports` + clinical form controls на thyroid/OB workspaces  

## Templates (prod DB)

| slug | domain |
|------|--------|
| `adnex-orads-v1` | adnex |
| `thyroid-tirads-v1` | thyroid |
| `obstetric-biometry-v1` | obstetric |

## Smoke prod (`BASE_URL=https://sonogyn-pro.ru`)

| Domain | Persist → finalize → GET |
|--------|---------------------------|
| adnex | ✅ citations 6 |
| thyroid | ✅ citations 3 |
| obstetric | ✅ citations 9 |

Скрипт: `apps/web/scripts/sre-persist-smoke.mjs`

## Миграции

- `20260623120000_structured_reports.sql`  
- `20260801121000_sre_thyroid_obstetric_templates.sql`  

## T1.5 Mobile ReportPreview (2026-08-01)

- Экран `StructuredReportPreview`: RU/EN, offline cache, PDF share
- Cloud: `POST /api/reports` + `PATCH` правки/finalize (Bearer)
- Handoff: O-RADS wizard, TI-RADS ACR panel, Tools → «SRE Акуш.»
- Deep link: `reports/:domain?` (adnex|thyroid|obstetric)

## Следующее

T1.6+ (orads-us navigator) или polish O-RADS→SRE на web — по приоритету приёма.
