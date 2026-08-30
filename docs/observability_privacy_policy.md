# Observability Privacy Policy — SonoGyn Pro

## Scope

Error monitoring via **Sentry** (or Sentry-compatible **GlitchTip**).  
No duplicate APM stack — Vercel Logs + optional Sentry for exceptions and performance samples.

## Activation (opt-in)

| Variable | Purpose |
|----------|---------|
| `SENTRY_ENABLED=1` | Master switch |
| `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` | Ingest endpoint |
| `SENTRY_RELEASE` | Release tag (default: `VERCEL_GIT_COMMIT_SHA`) |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | CI source map upload only (GitHub secret) |
| `SENTRY_TEST_SECRET` | Ops probe `POST /api/health/sentry-test` |

Without `SENTRY_ENABLED` + DSN, **no telemetry leaves the app**.

## Environments

| Environment | Source | Traces sample | Replay |
|-------------|--------|---------------|--------|
| development | local | 0 | off |
| preview | Vercel preview | 2% | off |
| production | Vercel production | 5% (tunable) | 1% public pages only |

## Data never sent (scrubbed in `beforeSend`)

- ФИО, телефоны, email, даты рождения
- Номера карт, полисов, СНИЛС, patient/study/case IDs in payloads
- Тексты протоколов, заключений, AI-диалогов
- DICOM metadata (UID, filenames)
- Signed Supabase storage URLs
- JWT, cookies, Authorization headers
- Base64 images / long binary blobs
- User input from medical forms (`form_data`, `user_input`)
- Request bodies on all events (`request.data` deleted)

Implementation: `apps/web/lib/sentry/scrub-event.ts`

## Session Replay

**Blocked** (sample rate 0 + `beforeAddRecordingEvent`) on:

- `/cases/*`, `/workspace/*` (protocols)
- `/profile/*`, `/patients/*`
- `/tools/imaging/*` (DICOM viewer)
- `/api/ai/*`, `/api/cases/*`, `/api/dicom/*`, uploads/media routes

Public pages (login, landing, education): replay allowed with **maskAllText**, **maskAllInputs**, **blockAllMedia**, no network body capture.

## Clinical route policy

- Breadcrumbs dropped on clinical API/page paths
- Query string stripped entirely on clinical URLs in error events
- Error boundaries use `captureSafeException` — only digest/tags, not raw `error.message`

## Source maps

- Uploaded in CI when `SENTRY_AUTH_TOKEN` is set (GitHub secret)
- `hideSourceMaps: true` — maps not served publicly
- `deleteSourcemapsAfterUpload: true`

## API monitoring

- `instrumentation.ts` → `onRequestError = Sentry.captureRequestError`
- Route handlers → `handleApiError` / `logError` (redacted console + optional Sentry)

## Test probe (no PHI)

```bash
curl -X POST https://<host>/api/health/sentry-test \
  -H "x-sentry-test-secret: $SENTRY_TEST_SECRET"
```

Event: `sonogyn-sentry-privacy-test` with tag `synthetic=true`.

## Automated proof

`pnpm --filter @repo/web test:security` includes:

- `lib/sentry/__tests__/observability-privacy.test.ts`
- `lib/sentry/__tests__/scrub-event.test.ts`

## Responsibilities

| Role | Action |
|------|--------|
| Dev | Never `sendDefaultPii: true`; never log message bodies in API routes |
| Ops | Store DSN/auth token in Vercel/GitHub secrets only |
| Clinical | Final interpretation always by physician — telemetry is infra-only |

## Alternatives

Self-hosted **GlitchTip** (EU/RU-friendly) uses the same DSN format and SDK — no code change beyond DSN URL.

*Last updated: feature/privacy-safe-observability*
