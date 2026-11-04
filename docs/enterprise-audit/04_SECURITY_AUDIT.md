# 04 — Enterprise Security Audit

**Scope:** code + SQL migrations + Supabase security advisors. No secret values. No prod config changes.

## Posture overview

| Area | Assessment |
|------|------------|
| EMR IDOR (patients/studies) | Strong: RLS + API ownership |
| Rate limiting | Strong if Upstash present (fail-closed) |
| Teaching-case PHI | Publish anonymization trigger + app guards |
| Profiles privacy | **Weak** after reputation migration |
| Open-access defaults | **Weak** for abuse/cost boundary |
| SECURITY DEFINER exposure | **Weak** (advisor 65× anon + 65× authenticated) |
| Password leak protection | **Disabled** (advisor WARN) |

**P0 (confirmed remote exploit with correct prod env):** none in static analysis.  
**P1 must fix before scale / public marketing push.**

## 1. Authentication & authorization

| Control | Path |
|---------|------|
| Session cookies | `utils/supabase/middleware.ts`, `cookie-options.ts` (httpOnly, secure in prod) |
| Page RBAC | `middleware.ts` — admin/author |
| API roles | `require-clinical-role.ts` |
| Medical access ≠ persona | `20260731120000_medical_access_gate.sql` — blocks self role escalation |
| Open access | `lib/auth/dev-account.ts` — defaults **enabled** unless env `false` |
| Prod secret guard | `production-secrets.ts` — blocks `DEV_SKIP_AUTH`, weak internal secret, missing Upstash/SRK |

## 2. RLS & tenant isolation

- Single-tenant **per-doctor** EMR (`created_by = auth.uid()`), not multi-clinic org yet.
- B2B clinic isolation **not implemented** as first-class tenant_id — blocker for 100k / enterprise ЛПУ.

### Advisor security (2026-11-04)

| Lint | Count | Notes |
|------|------:|-------|
| `rls_enabled_no_policy` | 1 | `public.user_metadata` |
| `function_search_path_mutable` | 6 | Cases/protocol guards |
| `anon_security_definer_function_executable` | 65 | Includes `backfill_all_reputation`, `apply_moderation_penalty`, awards… |
| `authenticated_security_definer_function_executable` | 65 | Same set |
| `auth_leaked_password_protection` | 1 | HIBP off |

## 3. PHI protection

| Control | Path |
|---------|------|
| Patient create/update | `patient-phi-guard.ts` + auto-suspend |
| Teaching cases | `teaching-case-phi-guard.ts` + SQL publish gate |
| AI chat | `detectPhi` before LLM |
| Messenger | reject PHI payload helpers |
| Sentry | `scrub-event.ts` |
| Privacy page | `app/privacy/page.tsx` — educational product framing |

**Educational cases:** table comment on `public.cases` — anonymized only; media anonymization enforced for public publish.

## 4. Secrets management

- Names catalogued in `.env.example` — values only in Vercel/local `.env.local` (not audited values).
- Gaps: `VERIFICATION_CODE_PEPPER` optional; `AUTH_RATE_LIMIT_RELAXED` not in prod violations list.

## 5. Rate limiting

- Upstash sliding window — `lib/security/rate-limit.ts`.
- Edge SMS limiter fail-closed.
- Bot detection on `/api/*` (`bot-detection.ts`).
- Open-access shares synthetic user id → coarse RL key (P3).

## 6. Audit logging

| System | Path |
|--------|------|
| Security audit | `security-audit-log.ts` → RPC `insert_security_audit_event` |
| Copilot EMR | `lib/copilot/audit.ts` → `audit_logs` |
| SaaS | `audit_log` table (~447 rows) |

Gap: empty IP/UA in RPC; `GRANT EXECUTE` to authenticated (forgery of action strings, actor still uid).

## 7. Encryption & retention

- At-rest: Supabase/Vercel managed.
- Mobile SecureStore; Expo web falls back to AsyncStorage (`encryptedStore.ts`).
- Retention periods **not numeric** in privacy policy — process gap.
- Backup isolation: not documented (dashboard).

## 8. Edge Functions

MCP: all four functions `verify_jwt: false`. Must rely on shared secrets; treat as P1 ops verification.

## Findings (prioritized)

### P1

| ID | File / evidence | Problem | Impact | Solution | Verify |
|----|-----------------|---------|--------|----------|--------|
| SEC-P1-01 | `20261022_verification_reputation.sql` L353–355 | `profiles` SELECT all authenticated | License #, Stripe customer id, medical_access visible to peers | Migration restoring roster policy / view for badges | User A cannot `select *` user B |
| SEC-P1-02 | `dev-account.ts`, `.env.example` | Open-access default true | Anonymous Pro-like paths, AI cost | Prod `NEXT_PUBLIC_OPEN_ACCESS_FULL=false` | Unauth AI → 401 |
| SEC-P1-03 | `rate-limit.ts` | `AUTH_RATE_LIMIT_RELAXED` allowed in prod | Auth brute-force | Add to `getProductionSecretViolations` | Deploy refuses relaxed |
| SEC-P1-04 | Advisors ×65 DEFINER | Critical RPCs executable by anon | Reputation/moderation abuse | `REVOKE EXECUTE FROM anon, authenticated` except intentional; grant service_role | Advisor count ↓; RPC 401 |
| SEC-P1-05 | Auth advisor | Leaked password protection off | Weak passwords | Enable in Supabase Auth settings | Advisor clear |
| SEC-P1-06 | Edge `verify_jwt: false` | URL+weak secret risk | Spam/push abuse | JWT on or Rotate secrets + deny public | Unauthorized invoke fails |

### P2

| ID | Evidence | Problem | Impact | Solution | Verify |
|----|----------|---------|--------|----------|--------|
| SEC-P2-01 | `require-trust-moderator.ts` | `ADMIN_EMAILS` bypass | Privilege via env | Prefer DB role | Email-only user 403 |
| SEC-P2-02 | Audit RPC grants | Client-callable audit insert | Noise/forgery | service_role writer | Direct RPC denied |
| SEC-P2-03 | No global API auth middleware | Forgotten `getUser` | IDOR regressions | Wrapper + lint | `test:e2e:security` |
| SEC-P2-04 | Protocol FINALIZED | Docs say not DB-locked | Tamper if API bug | Trigger/column lock | Lifecycle tests |
| SEC-P2-05 | Education `dangerouslySetInnerHTML` | XSS if CMS compromised | Session theft | `sanitizeCourseHtml` everywhere | XSS suite |
| SEC-P2-06 | Mobile CaseScreen upload | Magic-byte gap | Malware upload | `validateClinicalImageUri` | Mobile test |

### P3

| ID | Problem | Solution |
|----|---------|----------|
| SEC-P3-01 | Open-access shared RL key | Per-IP key |
| SEC-P3-02 | AsyncStorage on Expo web | Document no PHI |
| SEC-P3-03 | No retention schedule | Legal + policy update |

## Verification commands

```bash
pnpm --filter @repo/web test:security
pnpm --filter @repo/web test:e2e:security
pnpm --filter @repo/web test:e2e:auth
```

Manual: two-user IDOR on `patients`; profiles select; Auth HIBP toggle; Edge Function without secret.
