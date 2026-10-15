# Clinical Platform Audit — SonoGyn Pro

**Дата:** 2026-09-10  
**Ветка:** `feature/structured-case-editor`  
**Цель:** оценка зрелости MIS-архитектуры перед hardening без переписывания стека.

---

## 1. Стек и monorepo

| Компонент | Версия / инструмент |
|-----------|---------------------|
| Package manager | pnpm 10.6.5 (`packageManager` в корневом `package.json`) |
| Web | Next.js 16, React 19, TypeScript 5.x — `apps/web` |
| Mobile | Expo / React Native — `apps/mobile` |
| БД | Supabase PostgreSQL — миграции в `apps/web/supabase/migrations/` + mirror `packages/database/` |
| Shared types | `packages/types` (Zod) |
| Upload validation | `packages/upload-validation` (magic bytes) |
| PDF | `@repo/report-engine`, `DocumentExportToolbar` |
| Rich text | TipTap MIT (`ClinicalRichTextEditor`) — единый редактор |
| CI | GitHub Actions `.github/workflows/ci.yml` — typecheck, lint, test:security, build |

---

## 2. Что уже реализовано

### Доменные области

| Область | Статус | Ключевые пути |
|---------|--------|---------------|
| **Cases (teaching)** | ✅ | `apps/web/lib/cases/`, `packages/types/src/teaching-cases.ts` |
| **Case lifecycle** | ✅ v3 | RPC `transition_case_lifecycle`, `PATCH /api/cases/[id]/lifecycle` |
| **Case discussions** | ✅ | Realtime, comments, reactions, presence — migration `20260830170000` |
| **Structured case editor** | ✅ | 13 секций, autosave, versioning — `lib/structured-editor/` |
| **Protocol structured draft** | ✅ | 8 секций, lifecycle FINALIZED/AMEND, content_hash |
| **Structured reports (SRE)** | ✅ | `draft→finalized`, `structured_reports` |
| **Calculators** | ✅ | O-RADS, BI-RADS, TI-RADS, FIGO в `packages/*` |
| **PDF export** | ✅ | Case + protocol spec builders |
| **AI assistant** | ✅ hardened | AI SDK, prompt injection guard, session persistence |
| **Audit (domain)** | ✅ partial | `case_lifecycle_events`, structured editor audit, copilot audit |
| **Sentry** | ✅ opt-in | PHI scrubbing, clinical route denylist |
| **Upload magic bytes** | ✅ web+mobile | `@repo/upload-validation` |
| **Anonymization gate** | ✅ manual | Checklist перед publish |
| **Rate limiting** | ✅ | `lib/security/api-rate-limit.ts` |
| **Session wipe** | ✅ partial | `wipe-clinical-local.ts` on logout |

### Жизненный цикл кейса

Канонические статусы **реализованы**: `open → discussion → resolved → confirmed → archived`.

- State machine: `packages/types/src/case-discussions.ts` (`CASE_LIFECYCLE_TRANSITIONS`)
- Сервер: RPC в `20260830170000_case_discussions_v3.sql`
- UI: `CaseLifecyclePanel.tsx`
- История: `case_lifecycle_events`, `GET .../lifecycle/history`

### Жизненный цикл протокола

- **Legacy form:** `UltrasoundProtocolForm.tsx` (encrypted localStorage draft)
- **Structured draft:** versioning без FINALIZED/AMENDED lock
- **SRE:** finalize в `structured-reports-service.ts`

---

## 3. Что реализовано частично

| Область | Пробел |
|---------|--------|
| Единый service-слой | Thin API → RPC; нет единого `ClinicalDomainService` |
| Dual-axis cases | Legacy `status` (draft/published) ≠ `lifecycle_status` |
| Audit OPEN→DISCUSSION | Триггер без записи в audit (**исправлено** migration `20260910180000`) |
| `security_audit_log` | RLS только `service_role`; client insert fails silently |
| Protocol finalize | Нет immutable FINALIZED + AMENDED chain |
| EXIF strip | ✅ JPEG/PNG/WebP на case media upload |
| Mobile lifecycle | Нет parity с web |
| Performance budget | Lighthouse soft smoke есть; baseline не зафиксирован |
| Idempotency | Не было на lifecycle (**добавлено** в hardening migration) |

---

## 4. Чего не хватает (следующие этапы)

1. **Protocol lifecycle** — DRAFT/REVIEW/FINALIZED/AMENDED/ARCHIVED с `content_hash`
2. **EXIF/metadata stripping** на upload pipeline
3. **Unified audit viewer** — cross-domain query API
4. **Mobile parity** — lifecycle + structured editor read-only
5. **E2E** lifecycle + finalize smoke
6. **RLS audit** всех clinical tables (см. `docs/security/rls-audit.md`)
7. **Encrypt structured editor autosave** (parity с protocol form)

---

## 5. Риски

| Риск | Severity | Mitigation |
|------|----------|------------|
| Прямой UPDATE `lifecycle_status` | High | Trigger guard (`20260910180000`) |
| PHI в Sentry/logs | High | `scrub-event.ts`, `safeLog` — расширять при новых полях |
| Confirm без диагноза | Med | Server + API validation (hardening) |
| Published + lifecycle open | Med | Документировать; опционально sync при publish |
| Prod migrations not applied | Med | Staging smoke перед apply |
| localStorage clinical drafts | Med | Wipe on logout; encrypt autosave (TODO) |

---

## 6. Файлы для изменения (этап 1 — lifecycle slice)

| Действие | Путь |
|----------|------|
| Создан | `apps/web/lib/cases/lifecycle-service.ts` |
| Создан | `apps/web/lib/api/request-context.ts` |
| Изменён | `apps/web/app/api/cases/[caseId]/lifecycle/route.ts` |
| Изменён | `packages/types/src/case-discussions.ts` |
| Создан | `apps/web/lib/cases/__tests__/lifecycle-transitions.test.ts` |
| Создан | `apps/web/supabase/migrations/20260910180000_case_lifecycle_hardening.sql` |

---

## 7. Миграции (подготовлены, не для prod без staging)

| Migration | Назначение |
|-----------|------------|
| `20260910180000_case_lifecycle_hardening.sql` | request_id, idempotency, audit guard, clinical_platform_audit_events |
| `20260901120000_structured_editor_public_read.sql` | RLS public read structured docs |
| `20260830170000_case_discussions_v3.sql` | Base lifecycle v3 (если ещё не applied) |

---

## 8. Обратная совместимость

- Legacy `status` axis **не удаляется**
- RPC signature **расширена** (новые optional params с defaults)
- Новые confirmation methods **additive** (`laboratory`, `clinical_follow_up`)
- API response добавляет `requestId` — старые клиенты игнорируют
- Fallback при отсутствии колонок (`42P01`) сохранён в list/history routes

---

## 9. Порядок внедрения

1. ✅ Аудит (этот документ)
2. ✅ Case lifecycle hardening (vertical slice 1)
3. ✅ Protocol lifecycle finalize/amend (migration `20260910190000`)
4. ✅ Upload EXIF strip (web case media)
5. ⏳ RLS full audit fixes (security_audit RPC ✅)
6. ⏳ Performance baseline capture (docs ready)
7. ⏳ Mobile UI badges (types wired)

---

## 10. Критерии готовности (этап 1)

- [x] Запрещённые переходы отклоняются сервером (RPC + unit tests)
- [x] Confirm требует method + diagnosis (API + RPC)
- [x] Audit OPEN→DISCUSSION
- [x] request_id в lifecycle events
- [x] Idempotency-Key support
- [x] Trigger блокирует прямой UPDATE lifecycle_status
- [x] Append-only `clinical_platform_audit_events`
- [x] Unit tests lifecycle state machine
- [ ] E2E lifecycle (следующий этап)
- [ ] Prod migration apply (ручная операция)
