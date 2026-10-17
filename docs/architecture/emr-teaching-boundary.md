# EMR vs teaching cases — product & data boundary

**Phase A · 2026-10-17**

## Назначение

| Домен | Для кого | Данные | Хранение |
|-------|----------|--------|----------|
| **Teaching gallery** | Обсуждение обезличенных кейсов | `cases`, media, structured editor, lifecycle | Публикация после anonymization gate |
| **EMR / copilot** | Личный рабочий контур врача | `patients`, `studies`, protocols, copilot images | **Только владелец** (`created_by`) |

Оба контура сосуществуют в одном приложении; **не смешивать** учебные публикации с персональными картами.

## Технические границы

- **EMR API:** префиксы в `apps/web/lib/security/emr-scope.ts` (`/api/patients`, `/api/copilot`, …).
- **Teaching API:** `/api/cases/*`.
- **RLS EMR:** `20260506000000_clinical_copilot_schema.sql` — `created_by = auth.uid()`.
- **Teaching RLS:** `cases`, `case_media`, discussions — см. `docs/security/rls-audit.md`.
- **AI memory** (`clinical_ai_memory`) может ссылаться на `patient_id`; API проверяет ownership пациента перед insert.

## PHI

- **Patients:** `assessPatientPhiPayload` — запрет ПДн в EMR полях (platform policy).
- **Teaching cases:** `assessTeachingCasePhi` на create/publish (`title`, `description`, `anatomy`, `pathology`).
- **AI chat:** `detectPhi` / `rejectIfPhiInTextFields`.

## Что не делаем без отдельного решения

- Массовое удаление EMR API или таблиц.
- Автоматическое копирование EMR → teaching case.
- Общую ленту с PHI из patients.

## EMR API appendix (read-only inventory)

| Method | Route | Auth | Owner scope |
|--------|-------|------|-------------|
| GET | `/api/patients` | required | `.eq("created_by", user.id)` |
| POST | `/api/patients` | required | PHI guard + insert own |
| GET/PATCH/DELETE | `/api/patients/[patientId]` | required | `created_by` |
| GET | `/api/patients/[patientId]/studies` | required | patient + studies owner |
| * | `/api/copilot/*` | required | study chain RLS |
| * | `/api/studies/*` | required | owner-scoped |

Teaching (выборка):

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/api/cases` | Gallery search; auth optional for part of feed |
| POST | `/api/cases` | Draft + PHI guard |
| POST | `/api/cases/[id]/publish` | Owner + media gate + PHI guard |

## Тесты

- Static contract: `lib/security/__tests__/emr-access-contract.test.ts` (проверяет наличие owner filter в ключевых handlers).
- CI stub IDOR: `tests/e2e/emr-idor-smoke.spec.ts` (только `isE2eCiStubMode()` — fixture patients, два e2e-аккаунта).
- Staging/prod-like: `npm run test:staging-emr-idor` — `scripts/staging-emr-idor-smoke.mjs` + `.env.staging-idor` (read-only GET checks).
