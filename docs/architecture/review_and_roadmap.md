# Architecture Review & Implementation Roadmap

> BLOCK 5 — Review + Roadmap (no code)

---

## 1. Scalability risks

| Risk | Area | Severity | Improvement |
|------|------|----------|-------------|
| Monolith Next.js bundle | Web | Medium | Lazy routes per domain; `@repo/*` tree-shaking |
| Duplicate O-RADS logic | Mobile legacy vs orads-us | **High** | Deprecate `oradsCalculator.ts`; single package |
| localStorage quiz progress | Exams | Medium | Migrate to Supabase `exam_attempts` phase 2 |
| LLM latency in Tutor/CDE | AI | Medium | Rule-first; LLM optional; cache RAG |
| FTS on cases without vector | Search | Low | Add pgvector when >10k cases |
| Turbo build all packages | CI | Low | Filter build scope in CI to changed pkgs |
| Video/media storage cost | Cases, Atlas | Medium | CDN + size limits; transcode pipeline exists |

---

## 2. Security risks

| Risk | Mitigation |
|------|------------|
| IDOR on `structured_reports` | RLS + `requireStudyAccess` |
| XSS in case discussion | Sanitize markdown; CSP (exists) |
| AI prompt injection in Tutor | Tool allowlist; no raw SQL; output Zod |
| Signed URL abuse for media | Short TTL; content-type verify |
| PHI in leaderboard | Opt-in pseudonyms only |
| Moderator privilege escalation | `profiles.role` check server-side only |

---

## 3. Supabase risks

| Risk | Mitigation |
|------|------------|
| Migration drift web vs packages/database | Single source: `apps/web/supabase/migrations` → sync script |
| RLS bypass via service role | Never expose service key client-side |
| Realtime on `cases` leak | Policies on `teaching_case_comments` tested |
| JSONB input without Zod | API validates before insert |
| `--no-frozen-lockfile` on Vercel | Pin lockfile in CI |

---

## 4. Mobile risks

| Risk | Mitigation |
|------|------------|
| Offline/sync conflict | Last-write-wins + draft status |
| Large atlas assets | Progressive download; Wi-Fi hint |
| Expo bundle size | Feature modules; lazy screens |
| Parity lag vs web | Shared `@repo/*` mandatory in PR checklist |
| SecureStore for tokens | Already pattern; extend for exam certs |

---

## 5. Suggested improvements (architecture)

1. **Unified `@repo/clinical-input`** — Zod schema for all navigators (O-RADS, IOTA, BI-RADS)
2. **Event bus** — `report.finalized`, `case.published` for analytics
3. **Feature flags** — Vercel env / Supabase config for phased rollout
4. **Version pinning** — template `engine_id` + semver in reports
5. **Audit trail** — extend `audit_log` for report finalize actions

---

## 6. Implementation roadmap — Phase 1

Tasks **≤4 hours** each. Dependency graph top → bottom.

### Dependency graph

```
T1.1 types/schemas
  └─► T1.2 report-engine core
        └─► T1.3 API generate + migration
              └─► T1.4 Web ReportWorkspace
                    └─► T1.5 Mobile preview
T1.6 orads-us navigator hook
  └─► T1.7 Web O-RADS wizard unify
        └─► T1.8 Mobile wizard unify
T1.9 iota triangulation UI
  └─► T1.10 SRE handoff O-RADS→report
T1.11 cases schema extend
  └─► T1.12 cases search API
        └─► T1.13 cases UI tags/filters
              └─► T1.14 mobile cases list
```

### Task table

| ID | Task | Deps | Est | Risk (1-5) |
|----|------|------|-----|------------|
| **T1.1** | Zod schemas: StructuredReport*, ReportTemplate | — | 3h | 2 | ✅ |
| **T1.2** | `@repo/report-engine` adnex renderer + i18n ru | T1.1 | 4h | 3 | ✅ |
| **T1.3** | Supabase migration structured_reports + RLS + POST generate API | T1.2 | 4h | 4 | ✅ prod 2026-08-01 |
| **T1.4** | Web ReportWorkspace (3 blocks editable) | T1.3 | 4h | 2 | ✅ + thyroid/OB seed 2026-08-01 |
| **T1.5** | Mobile ReportPreview + share | T1.2 | 4h | 3 | ✅ cloud persist + TI-RADS/OB 2026-08-01 |
| **T1.6** | `useOradsNavigator` headless hook in orads-us | — | 3h | 2 | ✅ |
| **T1.7** | Web O-RADS stepper → orads-us tree only | T1.6 | 4h | 3 | ✅ |
| **T1.8** | Mobile OradsWizard → orads-us (remove legacy) | T1.6 | 4h | 4 | ✅ |
| **T1.9** | IOTA tab + triangulation panel (web) | T1.7 | 4h | 3 | ✅ + mobile 2026-08-01 |
| **T1.10** | O-RADS result → SRE prefill | T1.4, T1.7 | 3h | 2 | ✅ shared mapper in report-engine |
| **T1.11** | Cases: orads/tags columns + RLS review | — | 3h | 3 | ✅ prod + packages/database mirror |
| **T1.12** | GET /api/cases search + filters | T1.11 | 4h | 3 | ✅ |
| **T1.13** | Web cases filter UI + expert queue stub | T1.12 | 4h | 2 | ✅ stub = toast Phase 2 |
| **T1.14** | Mobile cases browse | T1.12 | 4h | 3 | ✅ + O-RADS/tags filters |

**Phase 1 total:** ~14 tasks ≈ 49h (~6–7 dev-days)

### Risk scores legend

- 5 = security/PHI/medico-legal
- 4 = breaking change / migration
- 3 = cross-platform parity
- 2 = UI-only
- 1 = docs/types

---

## 7. Phase 2 preview (backlog)

| ID | Task | Est |
|----|------|-----|
| T2.1 | `@repo/education-quiz` extract | 4h | ✅ 2026-08-01 |
| T2.2 | exam_attempts migration + RLS | 4h | ✅ 2026-08-01 |
| T2.3 | ExamEngine MCQ + image Q | 4h |
| T2.4 | AI Tutor API + Explain mode | 4h |
| T2.5 | Tutor Quiz + Exam modes | 4h |
| T2.6 | Daily challenge cron + UI | 4h |
| T2.7 | Atlas 2.0 annotation model | 4h |
| T2.8 | Learning Center track progress | 4h |

---

## 8. Phase 3 preview

| ID | Task | Est |
|----|------|-----|
| T3.1 | `@repo/clinical-decision-engine` skeleton | 4h |
| T3.2 | CDE classification plugins | 4h |
| T3.3 | CDE → SRE integration | 4h |
| T3.4 | AI Second Opinion workflow | 4h |
| T3.5 | Clinic org + seats (B2B) | 8h |

---

## 9. Next chat workflow (as requested)

1. ✅ **This doc** — review architecture
2. **Next chat:** approve Phase 1 → refine task breakdown
3. **Then chat:** `Implement T1.1 only` — plan before code

---

## 10. Approval checklist

- [x] Phase 1 scope approved (SRE + O-RADS + IOTA + Cases)
- [x] New packages naming approved
- [x] Supabase new tables approved
- [x] Mobile parity timeline accepted (SRE v1.1 ok?)

**Status: PHASE 1 CLOSED · 2026-08-01** — see `docs/ux-sre-gate/PHASE1_CLOSEOUT.md`
