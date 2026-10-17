# Feature Inventory — Web / Mobile / Backend / DB / Tests

**Дата:** 2026-10-17  
**Статусы:** VERIFIED | IMPLEMENTED_UNVERIFIED | PARTIAL | UI_ONLY | BROKEN | MISSING | BLOCKED | NOT_APPLICABLE

Полный reестр **всех** ~199 страниц не дублируется построчно; ниже — **канонические функции продукта** с evidence. Для маршрутов см. glob `apps/web/app/**/page.tsx`.

---

## Сводная таблица (Part 12)

| ID | Раздел | Функция | Web | Mobile | Backend | DB | Tests | Status | Evidence | Sev | Recommendation |
|----|--------|---------|-----|--------|---------|-----|-------|--------|----------|-----|----------------|
| F-001 | Authentication | Email/password + Supabase session | Y | Y | Y | auth.users | e2e auth | IMPLEMENTED_UNVERIFIED | `/login`, `/api/auth/sign-in` | P2 | Smoke prod auth matrix |
| F-002 | Authentication | Phone/SMS OTP | Y | ? | Y | — | partial | IMPLEMENTED_UNVERIFIED | `/api/auth/phone/*`, `/api/auth/sms/*` | P2 | Document mobile parity |
| F-003 | Authentication | Telegram login | Y | ? | Y | — | — | IMPLEMENTED_UNVERIFIED | `/api/auth/telegram/*` | P3 | Security review bot token handling |
| F-004 | Authentication | MFA verify login | Y | — | Y | — | — | PARTIAL | `/api/auth/mfa/verify-login` | P2 | Mobile MFA gap |
| F-005 | Authentication | Guest / dev / e2e bypass | Y | — | Y | — | e2e | PARTIAL | `DEV_SKIP_AUTH`, `(e2e-public)/demo` | P1 | Never on prod flags |
| F-006 | Profile | User profile CRUD | Y | Y | Y | profiles | — | IMPLEMENTED_UNVERIFIED | `/profile`, `/api/profile` | P2 | Export GDPR path exists |
| F-007 | Navigation | 5 primary tabs SSOT | Y | Y | — | — | nav tests | VERIFIED | `primary-nav.ts`, `MainTabs` | — | Keep SSOT |
| F-008 | Navigation | Feed / home | Y | Y | Y | cases feed | — | IMPLEMENTED_UNVERIFIED | `/feed`, `/home`, `/app` | P2 | Consolidate legacy URLs |
| F-009 | AI Assistant | Sonogyn chat stream | Y | partial | Y | chat sessions | security+ai tests | IMPLEMENTED_UNVERIFIED | `/api/ai/chat/route.ts` | P1 | Citation UX + eval set |
| F-010 | AI Assistant | Evidence mode + unified search | Y | — | Y | evidence tables | ER tests 11 | PARTIAL | `searchEvidenceUnified`, `evidence-context.ts` | P1 | Mandatory sources UI |
| F-011 | AI Assistant | Domain RAG-lite snippets | Y | — | — | — | — | PARTIAL | `rag-context.ts` | P2 | Not full vector RAG |
| F-012 | AI Assistant | Vision / case media analyze | Y | — | Y | case_media | — | IMPLEMENTED_UNVERIFIED | `/api/ai/analyze`, `us-vision/*` | P2 | Cost + PHI guard audit |
| F-013 | AI Assistant | Specialty assists (ORADS, breast, thyroid…) | Y | stack | Y | — | partial | IMPLEMENTED_UNVERIFIED | `/api/ai/orads`, `breast-assist`, etc. | P2 | Unify with chat |
| F-014 | Medical Knowledge | Guidelines sync | Y | — | cron | guidelines | — | IMPLEMENTED_UNVERIFIED | `sync:guidelines`, cron ingest | P2 | Version metadata |
| F-015 | Medical Knowledge | Nosology pages | Y | partial | Y | nosology | — | IMPLEMENTED_UNVERIFIED | `/nosologies/[id]`, admin | P2 | Link to evidence |
| F-016 | Medical Knowledge | Medical knowledge retrieve API | Y | — | Y | sources | — | IMPLEMENTED_UNVERIFIED | `/api/medical-knowledge/retrieve` | P1 | Trace to AI answers |
| F-017 | Search | Unified clinical search (PR #52) | Y | — | Y | local indexes | — | IMPLEMENTED_UNVERIFIED | search routes in web lib | P2 | Mobile search MISSING |
| F-018 | Calculators | O-RADS US wizard | Y | Y | Y | — | **42 pass** | VERIFIED | `@repo/orads-us`, `/calculators/o-rads` | — | Keep tests on changes |
| F-019 | Calculators | BI-RADS US | Y | Y | partial | — | package tests | IMPLEMENTED_UNVERIFIED | `@repo/birads-us`, calc routes | P2 | Dedupe breast-classification |
| F-020 | Calculators | TI-RADS | Y | Y | partial | — | — | PARTIAL | dual packages | P2 | Consolidate packages |
| F-021 | Calculators | FMF / OB calculators | Y | Y | Y | — | root obstetric tests | IMPLEMENTED_UNVERIFIED | `@repo/fmf`, `/calculators/ob` | P2 | Run obstetric test suite in CI |
| F-022 | Calculators | CPI / cervical intelligence | Y | Y | Y | — | **cpi e2e** | IMPLEMENTED_UNVERIFIED | `/api/cpi/evaluate`, CPI package | P1 | Clinical validation docs |
| F-023 | Classifications | IOTA terms / O-RADS guide | Y | partial | — | content | — | IMPLEMENTED_UNVERIFIED | library + tools refs | P3 | — |
| F-024 | Atlases | Obstetric / fetal spine / adnex | Y | partial | — | content | — | PARTIAL | library routes, fetal-spine-cards app | P3 | Mobile atlas parity |
| F-025 | Clinical Cases | Case list + detail | Y | Y | Y | teaching_cases | lifecycle tests | IMPLEMENTED_UNVERIFIED | `/cases`, `/api/cases` | P1 | Mobile structured editor |
| F-026 | Clinical Cases | Lifecycle state machine | Y | — | Y | RPC | **unit pass** | IMPLEMENTED_UNVERIFIED | `lifecycle/route.ts`, migrations | P1 | Mobile parity |
| F-027 | Clinical Cases | Structured editor 13 sections | Y | — | Y | structured | unit | IMPLEMENTED_UNVERIFIED | `lib/structured-editor/` | P1 | Mobile read-only |
| F-028 | Clinical Cases | Discussions realtime | Y | ? | Y | comments | permissions test | IMPLEMENTED_UNVERIFIED | migrations 20260830170000 | P2 | Mobile |
| F-029 | Community | Community hub / social cases | partial | orphan UI | Y | — | — | PARTIAL | `CommunityHubScreen`, `/api/cases/social` | P2 | Wire or remove orphan |
| F-030 | Education | Courses / lessons / webinars | Y | — | Y | courses | — | IMPLEMENTED_UNVERIFIED | `/library/courses`, author API | P3 | Mobile gap |
| F-031 | Education | Quiz hub / self-assessment | Y | — | Y | — | — | IMPLEMENTED_UNVERIFIED | PR #52 quiz-hub | P2 | — |
| F-032 | EMR | Patients + studies | Y | — | Y | patients | security e2e | IMPLEMENTED_UNVERIFIED | `/patients`, `/api/patients` | **P0** | Product boundary + RLS |
| F-033 | EMR | Ultrasound protocol / copilot | Y | — | Y | studies | — | IMPLEMENTED_UNVERIFIED | `/workspace`, `/api/copilot/*` | P1 | Scope vs teaching |
| F-034 | Reports | Structured reports PDF | Y | — | Y | structured_reports | — | IMPLEMENTED_UNVERIFIED | `report-engine`, `/api/reports` | P2 | — |
| F-035 | Subscription | Stripe checkout | Y | — | Y | — | webhook test | IMPLEMENTED_UNVERIFIED | `/api/stripe/*`, `/pricing` | P3 | — |
| F-036 | Subscription | YooKassa | Y | — | Y | — | — | IMPLEMENTED_UNVERIFIED | `/api/yookassa/create` | P3 | — |
| F-037 | Administration | Admin users / medical access | Y | — | Y | — | — | IMPLEMENTED_UNVERIFIED | `/admin`, `/api/admin/*` | P1 | RBAC audit |
| F-038 | Security | Rate limiting | Y | Y | Y | — | security tests | VERIFIED | `lib/security/rate-limit` | — | — |
| F-039 | Security | PHI detection in AI | Y | — | Y | — | ai hardening tests | IMPLEMENTED_UNVERIFIED | `phi-detection.ts` | P1 | Extend to case publish |
| F-040 | Security | Upload magic bytes | Y | Y | Y | storage | upload-validation CI | VERIFIED | `@repo/upload-validation` | — | Mobile edge cases |
| F-041 | Analytics | Achievements engine | Y | — | Y | — | — | PARTIAL | `/achievements`, `engine.ts` (local TS errors) | P3 | Fix prisma local |
| F-042 | Accessibility | a11y e2e smoke | Y | — | — | — | e2e soft | IMPLEMENTED_UNVERIFIED | `test:e2e:a11y` | P2 | Strict opt-in |
| F-043 | Infrastructure | Vercel web deploy | Y | — | — | — | build CI | VERIFIED | CI turbo build | — | — |
| F-044 | Infrastructure | EAS Android APK | — | Y | — | — | — | VERIFIED | versionCode 7 artifact (session) | — | Shrink archive |
| F-045 | Infrastructure | EAS iOS device preview | — | — | — | — | — | BLOCKED | non-interactive credentials | P1 | `eas device:create` |
| F-046 | Infrastructure | Remotion video app | scripts | — | — | — | — | MISSING | no `@repo/video` package | P3 | Restore or remove scripts |
| F-047 | Notifications | In-app / telegram notify | partial | — | Y | — | — | PARTIAL | `/api/notify`, telegram | P3 | — |
| F-048 | Search | PubMed abstracts | Y | — | Y | — | — | IMPLEMENTED_UNVERIFIED | `/api/pubmed/abstracts` | P3 | — |

---

## Web route clusters (reference)

| Cluster | Example paths | Default status |
|---------|---------------|----------------|
| Tools / calc | `(clinical)/tools/calc/*`, `/calculators/*` | IMPLEMENTED_UNVERIFIED (per tool) |
| Tools / refs | `(clinical)/tools/refs/*` | Mostly content UI |
| Library | `(clinical)/library/*` | Education UI + some API |
| AI | `(clinical)/ai/*`, `/evidence-assistant` | IMPLEMENTED_UNVERIFIED |
| Assistant legacy | `(clinical)/assistant/*` | PARTIAL (redirects to AI tab) |
| Admin | `(clinical)/admin/*` | IMPLEMENTED_UNVERIFIED |
| Demo e2e | `(e2e-public)/demo/*` | NOT_APPLICABLE prod |

---

## Mobile parity matrix (summary)

| Function | Web | Mobile | Shared package |
|----------|-----|--------|----------------|
| O-RADS | ✅ | ✅ | `@repo/orads-us` |
| BI-RADS / TI-RADS stacks | ✅ | ✅ screens | birads / tirads packages |
| AI chat | ✅ | partial tab | API to prod URL in EAS |
| Teaching cases lifecycle | ✅ | list/detail only | types in `@repo/types` |
| Evidence assistant | ✅ | — | `@repo/evidence-retrieval` |
| EMR patients | ✅ | — | — |
| Courses | ✅ | — | — |

---

## Tests inventory

| Suite | Command | Audit run | Result |
|-------|---------|-----------|--------|
| Security unit | `pnpm --filter @repo/web test:security` | Yes | 110/110 |
| O-RADS | `pnpm --filter @repo/orads-us test` | Yes | 42/42 |
| Evidence retrieval | `pnpm --filter @repo/evidence-retrieval test` | Yes | 11/11 |
| CPI | `pnpm test:cpi` | No (CI) | CI green on main |
| Full e2e | `pnpm test:e2e` | No | CI job e2e |
| Full typecheck | `pnpm typecheck` | Partial local | CI with prisma generate |
