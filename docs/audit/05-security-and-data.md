# Security, Supabase, RLS, Storage & Data Handling

**Дата:** 2026-10-17  
**Policy:** no secrets printed; no destructive SQL executed.

---

## 1. Authentication & session

| Mechanism | Evidence | Status |
|-----------|----------|--------|
| Supabase Auth | `@/utils/supabase/server`, middleware | IMPLEMENTED_UNVERIFIED |
| requireSupabaseUser on AI | `chat/route.ts` | IMPLEMENTED_UNVERIFIED |
| Mobile token exchange | `/api/auth/mobile/exchange` | IMPLEMENTED_UNVERIFIED |
| Dev / e2e bypass | `DEV_SKIP_AUTH`, demo routes | PARTIAL — must be off prod |
| MFA route | `/api/auth/mfa/verify-login` | PARTIAL |

---

## 2. RLS & clinical tables

Canonical doc: `docs/security/rls-audit.md` (2026-09-10).

| Finding | Severity | Status |
|---------|----------|--------|
| Cases + discussions RLS | — | Documented ✅ |
| Lifecycle direct UPDATE blocked | High | Fixed migration `20260910180000` |
| `security_audit_log` client insert fails | Med | Open — server-only |
| Protocol FINALIZED DB lock | Med | **Gap** per rls-audit |
| Patient tables (EMR) | High | **Needs dedicated IDOR review** — not fully re-audited in this pass |

**Remote verify (prior session):** `npm run db:verify-hardening` with `.env.local` — probes passed for case/protocol lifecycle, audit, knowledge graph. **Not re-run** in this audit completion step.

---

## 3. API security patterns

| Pattern | Location | Test |
|---------|----------|------|
| Zod body schemas | `lib/security/__tests__/api-body-schemas.test.ts` | in test:security |
| Rate limiting | `lib/security/rate-limit.ts` | yes |
| ILIKE / XSS helpers | security hardening tests | yes |
| Payment webhooks | `lib/payment/__tests__/webhook-handler.test.ts` | yes |
| Case discussion permissions | `discussion-permissions.test.ts` | yes |
| PHI in logs | Sentry scrub tests | yes |

**Command:** `pnpm --filter @repo/web test:security` → **110/110 pass** (2026-10-17 local).

---

## 4. Uploads & files

| Feature | Web | Mobile | Evidence |
|---------|-----|--------|----------|
| Magic bytes validation | ✅ | ✅ package | `@repo/upload-validation`, CI step |
| Case media anonymization gate | ✅ | partial | API anonymization route |
| EXIF strip (JPEG/PNG/WebP) | ✅ | gap noted in arch audit | migration/docs |
| Copilot images bucket | ✅ | — | security_hardening migration ref |

---

## 5. AI-specific security

| Threat | Mitigation | Status |
|--------|------------|--------|
| Prompt injection | `detectPromptInjection` | IMPLEMENTED_UNVERIFIED |
| PHI in prompts | `detectPhi` | IMPLEMENTED_UNVERIFIED |
| Secret leakage to client | server-only LLM keys | IMPLEMENTED_UNVERIFIED |
| User isolation | session + user id on chat | IMPLEMENTED_UNVERIFIED |

---

## 6. Migrations & drift

| Tree | Files | Risk |
|------|-------|------|
| `apps/web/supabase/migrations` | 60 | Deploy source |
| `packages/database/supabase/migrations` | 45 | **Drift P0** |

**Confirmed vulnerabilities in this audit:** none exploited; **potential** IDOR on EMR if RLS misconfigured — requires staged penetration-style tests with fixtures.

---

## 7. Payments & webhooks

- Stripe + YooKassa routes exist; webhook handler unit tested.
- **Prod verification:** BLOCKED without staging keys.

---

## 8. Logging & observability

- Sentry: PHI scrub, clinical route denylist — tests pass.
- `safeLog` — use mandatory for new routes.

---

## 9. Data model tension: EMR vs teaching

| Data class | Tables/API | Product note |
|------------|------------|--------------|
| Teaching cases | `cases`, structured docs, media | Community/teaching focus |
| EMR patients | `/api/patients`, studies, protocols | Full clinical workflow |

**P0 recommendation:** explicit RBAC product modes; ensure teaching exports cannot pull EMR rows; audit `patients` RLS separately from `cases`.

---

## 10. Security smoke in CI

- Playwright `test:e2e:security` with `PLAYWRIGHT_SECURITY_E2E=true`, `OPEN_ACCESS_FULL=false` — green on main (historical CI).
- Not re-executed locally in audit finale.

---

## 11. Priority security backlog

| Pri | Task | Size |
|-----|------|------|
| P0 | Migration tree sync + staging apply checklist | M |
| P0 | EMR/patient RLS IDOR test suite | L |
| P1 | Fix `security_audit_log` server insert path | S |
| P1 | Protocol FINALIZED immutability at DB | M |
| P2 | Mobile upload parity (magic bytes edge cases) | M |
| P2 | Encrypt structured editor local autosave | M |
