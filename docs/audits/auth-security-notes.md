# SonoGyn Pro — Security Audit / Auth Hardening Notes

Проверено вручную: middleware, guards, API handlers, env boundary, SRE, mobile parity.

## Confirmed auth mechanisms
- Supabase Auth session cookies (`updateSession`) + role checks in middleware/admin guards.
- SMS/phone OTP endpoints with edge rate limit (`smsSendEdgeRateLimit`).
- Dev auth bypass only when `isDevSkipAuthEnabled()`; production hides `/api/auth/dev-login` via middleware.
- Protected routes redirect to `/login` unless allowed public calculators.
- Bot protection via `shouldBlockSuspiciousApiBot`.
- Security headers in middleware: `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.

## Owner-bound checks found
- `/api/patients/[patientId]` — `.eq("created_by", user.id)` ✅
- `/api/studies/[studyId]/protocol` — `assertStudyOwnedByUser` ✅
- `/api/reports/[id]` — `getStructuredReportById(...).eq("user_id", userId)` ✅
- `/api/cpi/cases/[caseId]` — repo.getCase(auth.userId, caseId) ✅
- `/api/author/courses/[courseId]` — `withAuthorCourseApi` → `assertCourseAccess` + `requireAuthorUser` ✅

## Potential hot spots / need review
- Any direct `.from("<table>").select(...).eq("id", <param>)` without owner eq in the same query.
- Webhook routes: ensure signature verification and do not trust client-supplied user_id.
- Mobile token storage: ensure not using plain localStorage for sensitive tokens.
- Password reset / MFA verify routes: check token lifetime and one-time use.

## TODO
- [ ] Add explicit owner test cases for each resource route.
- [ ] Verify secure token storage on mobile.
- [ ] Verify webhook route secret handling.
- [ ] Add auth audit log for failed access attempts.
