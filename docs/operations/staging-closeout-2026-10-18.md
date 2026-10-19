# Staging closeout — Phase A trust (localhost)

**Дата:** 2026-10-18  
**Operator:** automated + Ravshan (Cursor session)  
**GitHub `main` SHA:** `e98492b9` (merge PR #54; Phase A core — PR #53 `08a31d62`)

## Цель

Закрыть checklist `staging-migration-checklist.md` насколько возможно **без** отдельного Supabase branch (Pro plan required).

## Выполнено

| Check | Команда / действие | Результат |
|-------|-------------------|-----------|
| Migration drift | `npm run check:migration-drift` | ✅ 59 files aligned |
| Hardening probes | `cd apps/web && npm run db:verify-hardening` | ✅ (2026-10-17, ref `grnwcbyslttbrqznnunq`, read-only) |
| Security unit | `npm run test:security` | ✅ 120 tests |
| EMR IDOR (real API+DB) | `npm run setup:staging-idor` + `test:staging-emr-idor` | ✅ B→404, cleanup DELETE |
| Teaching PHI | `npm run test:staging-teaching-phi` | ✅ create/publish `phi_detected`; dev patients list empty |
| CI (GitHub) | PR #53, #54 | ✅ ci + e2e green on merge |
| Security e2e (local) | `PLAYWRIGHT_SECURITY_E2E=true npm run test:e2e:security` | ✅ 19 passed (2026-10-18) |
| EMR IDOR e2e stub (local) | `PLAYWRIGHT_SECURITY_E2E=true npm run test:e2e:emr-idor` | ✅ 4 passed (2026-10-18) |

## Частично / blocked

| Check | Статус | Примечание |
|-------|--------|------------|
| Isolated staging DB | ❌ blocked | Supabase branch → `PaymentRequiredException` (Pro). См. `staging-supabase-branch.md` |
| Pre-flight «не prod ref» | ⚠️ waived | Единственный project; smoke только **localhost** + cleanup |
| `GET /api/patients` → 401 без cookie | ⚠️ split | **Dev + OPEN_ACCESS_FULL:** 200 + `[]`. **Dev + E2E security env:** 403 на `/api/patients` (2026-10-18). **Prod URL:** 403 (Vercel Protection). Строгий 401 — отдельный smoke с prod-like env без protection |
| `db:migrate` на staging | — | N/A без branch; prod schema уже с hardening |
| Logs / Sentry §7 | — | Ручной sample, не в scope автопрогона |
| Production promote §10 | — | **Отдельное GO** — не выполнялось |

## Synthetic accounts (Auth)

- `staging-idor-user-a@sonogyn-pro.invalid`
- `staging-idor-user-b@sonogyn-pro.invalid`  

Credentials: локально `apps/web/.env.staging-idor` (gitignored). Пересоздать: `npm run setup:staging-idor`.

## Следующие шаги (рекомендация)

1. **Pro + branch** → повторить IDOR/PHI smoke на preview URL + branch ref.  
2. **Prod auth probe:** Vercel Deployment Protection bypass или internal smoke job с `OPEN_ACCESS_FULL=false`.  
3. **Block B (Evidence MVP):** design в `docs/ai/evidence-mvp-plan.md` — код после product GO.  
4. **§7 audit logs:** выборочно Sentry/runtime без PHI в теле.

## Stop criteria

На момент closeout **нет** сигналов IDOR (404 для B) и **нет** обхода PHI gate на create/publish teaching case.

---

*Не диагностическое заключение; операционный журнал staging.*
