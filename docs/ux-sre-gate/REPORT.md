# SRE Gate — Phase 1 closeout (2026-08-01)

**Персона:** врач-практик  

## Сделано по очереди

1. **A1** — миграция `structured_reports` + RLS на prod  
2. **A2/A3** — persist draft→finalize + ownership checks + Bearer JWT  
3. **Seed** — `thyroid-tirads-v1`, `obstetric-biometry-v1` в `report_templates`  
4. **UX** — hub `/reports` + clinical form controls на thyroid/OB workspaces  
5. **T1.5** — Mobile ReportPreview cloud parity  
6. **Closeout** — shared O-RADS→SRE mapper, mobile IOTA, cases filters, Zod bridge  

Полный отчёт: [PHASE1_CLOSEOUT.md](./PHASE1_CLOSEOUT.md)

## Templates (prod DB)

| slug | domain |
|------|--------|
| `adnex-orads-v1` | adnex |
| `thyroid-tirads-v1` | thyroid |
| `obstetric-biometry-v1` | obstetric |

## Smoke

```bash
BASE_URL=https://sonogyn-pro.ru node apps/web/scripts/sre-persist-smoke.mjs
BASE_URL=https://sonogyn-pro.ru node apps/web/scripts/phase1-closeout-smoke.mjs
```

## Следующее

Phase 2 — education / quiz (`T2.1` `@repo/education-quiz`).
