# RLS Audit — Clinical Tables

**Дата:** 2026-09-10  
**Scope:** cases, protocols, discussions, attachments, profiles, audit

## Summary matrix

| Table | RLS | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|-----|--------|--------|--------|--------|-------|
| `cases` | ✅ | owner/admin/public/moderator | owner | owner/admin | owner/admin | lifecycle via RPC |
| `case_lifecycle_events` | ✅ | discussion access | RPC only | — | — | append-only |
| `clinical_platform_audit_events` | ✅ | admin/mod/owner | RPC only | — | — | **new** |
| `teaching_case_comments` | ✅ | discussion access | authenticated | author/mod | mod | |
| `case_media` | ✅ | case access | owner | owner | owner | anon gate |
| `case_structured_documents` | ✅ | owner/public published | owner | owner | owner | |
| `protocol_structured_drafts` | ✅ | study owner | owner | owner | — | no finalize lock |
| `structured_reports` | ✅ | study access | owner | owner | — | finalized soft lock |
| `security_audit_log` | ✅ | service_role | service_role | — | — | **client insert broken** |
| `audit_log` (triggers) | ✅ | admin | trigger | — | — | 3 SaaS tables |

## IDOR checks

| Vector | Mitigation |
|--------|------------|
| Direct SELECT чужого case | RLS `cases_select_policy` |
| UPDATE чужого case | `cases_update_own` |
| Change `user_id` (owner) | No policy allows arbitrary owner change |
| Role escalation | `profiles` RLS + admin-only RPCs |
| Edit FINALIZED protocol | **Gap** — no DB lock yet |
| Edit lifecycle_status directly | **Fixed** — trigger guard `20260910180000` |

## Storage buckets

- Case media: signed URLs + RLS on `case_media` table
- Copilot images: separate bucket policies in `20260608120000_security_hardening.sql`

## Recommended migrations (future)

1. Fix `security_audit_log` — security definer insert function for server routes
2. Protocol FINALIZED column-level protection
3. Deny authenticated DELETE on audit tables (explicit REVOKE)

## Test references

- `docs/case_rls_test_results.md`
- `apps/web/lib/cases/__tests__/discussion-permissions.test.ts`
