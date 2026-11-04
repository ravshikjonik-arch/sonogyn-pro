# 01 — Current Architecture

**Evidence date:** 2026-11-04 · read-only

## 1. Monorepo

| Item | Path / fact |
|------|-------------|
| Workspace | `pnpm-workspace.yaml` → `apps/*`, `packages/*`, `modules/*` |
| Build | `turbo.json` + root `package.json` |
| Primary app | `apps/web` (`@repo/web`) — Next.js 16 PWA |
| Mobile | `apps/mobile` (Expo) → API via `EXPO_PUBLIC_API_BASE_URL` |
| Video | `apps/video` — artifact only; `@repo/video` package missing from workspace |
| Calculators SSOT | `packages/orads-us`, `birads-*`, `iota-models`, `medical-calculations`, … |
| Evidence | `packages/evidence-corpus`, `evidence-engine`, `evidence-retrieval` |
| DB migrations SSOT mirror | `packages/database/supabase/migrations/` ↔ `apps/web/supabase/migrations/` |
| Side compute | `services/us-ai-worker/` (Python Docker), optional Protocol AI |

## 2. Next.js / API

- **~194** `route.ts` under `apps/web/app/api/` (infra explore count).
- Top segments: `ai/` (26), `auth/` (25), `cases/` (22), `author/` (18), `admin/` (11), `evidence/` (6), `cron/` (4), EMR `patients`/`studies`, payments, messenger, CPI, copilot.
- Middleware: session refresh + page gates `/admin`, `/author` — `apps/web/middleware.ts`. **API auth per-route**, не global.
- Health: `GET /api/health` — env flags, DB latency probe, Upstash, stage3 metadata.

## 3. Supabase

| Field | Value |
|-------|-------|
| Project | `Sonogyn-Pro` / `grnwcbyslttbrqznnunq` |
| Region | `eu-west-1` |
| Engine | Postgres 17.6.1 |
| Status | `ACTIVE_HEALTHY` |
| Branches | **только `main`** (`list_branches`) |
| Extensions installed (selected) | `vector` 0.8.2, `pg_stat_statements`, `pg_net`, `pgcrypto`, `uuid-ossp`, `supabase_vault` |

### Edge Functions (ACTIVE)

| Slug | verify_jwt (MCP) |
|------|------------------|
| `notify-new-comment` | `false` |
| `notify-new-case-question` | `false` |
| `notify-new-chat-message` | `false` |
| `recalculate-reputation` | `false` |

Source tree: `apps/web/supabase/functions/`. JWT-off → полагаться на webhook secrets / internal auth (проверить ops).

### Storage

- `storage.buckets`: 8 buckets (RLS on).
- `storage.objects`: ~1799 rows (snapshot).
- Known buckets from migrations: `ultrasound-media`, `doctor-chat-media`, `teaching_case_media` / teaching-case, `clinical_avatars`, `verifications`, `medical-source-vault`.

### Auth

- Supabase Auth + SSR cookies (`utils/supabase/*`).
- Clinical roles: `profiles.role` + medical access gate migration `20260731120000_medical_access_gate.sql`.
- Product personas ≠ RBAC (architect rule).

## 4. Vercel

| Setting | Evidence |
|---------|----------|
| Region | `fra1` — `apps/web/vercel.json` |
| Build | Root pnpm install + Prisma generate + `@repo/web build`, `NODE_OPTIONS=8192` |
| Crons | 4 paths (daily-summary, guidelines ingest, RF regulations, process-regulation-queue) |
| Root `vercel.json` | Optional Python `ustri_inference` (gitignored path), 3008 MB / 300s |

Vercel team listing в этой сессии: **пустой** (`list_teams` count 0) — SSO/scope; prod env не выгружались.

## 5. Environment variables (NAMES ONLY)

Каталог: `apps/web/.env.example`, root `.env.example`, `apps/mobile/.env.example`.

**Core:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` (pooler), `DIRECT_URL`, `NEXT_PUBLIC_APP_URL`.

**Security / auth:** `SONOGYN_AUTH_INTERNAL_SECRET`, `UPSTASH_REDIS_REST_*`, `VERIFICATION_CODE_PEPPER`, `PLAYBACK_TOKEN_SECRET`, `AUTH_RATE_LIMIT_RELAXED`, `NEXT_PUBLIC_OPEN_ACCESS_FULL`, `DEV_SKIP_AUTH`, `CRON_SECRET`.

**AI:** `OPENROUTER_*`, `PERPLEXITY_*`, `COLIBRI_*`, `LLM_PROVIDER`, `LLM_FALLBACK_ORDER`, `OPENAI_API_KEY` (Whisper), `US_AI_WORKER_*`, `AI_DOCTOR_DAILY_*`, `AI_SDK_ENABLED`.

**Payments / media / realtime:** `STRIPE_*`, YooKassa, `LIVEKIT_*`, AWS/Yandex/Vercel Blob, Firebase, Sentry, Telegram, Turnstile, VAPID.

## 6. Background jobs

| Job | Mechanism |
|-----|-----------|
| Daily Telegram summary | Vercel cron → `/api/cron/daily-summary` |
| External guidelines ingest | Sunday 04:00 UTC |
| RF regulation discover | Mon/Thu 09:00 |
| Regulation extract queue | Mon/Thu 09:30 + `claim_regulation_ingest_jobs` |
| US analyze | `after()` in-request — **not** cron |
| Push / reputation | Edge Functions + DB webhooks |

## 7. External services (dependency graph)

```text
Web/Mobile → Vercel API → Supabase (Auth/PG/Storage/Realtime)
                      ├→ Upstash (RL + Evidence cache)
                      ├→ OpenRouter / Perplexity [/ Colibri]
                      ├→ US AI Worker (optional)
                      ├→ Stripe / YooKassa
                      ├→ LiveKit / S3-compatible / Blob
                      └→ Sentry / Telegram / Evidence HTTP APIs
```

## 8. CI/CD

| Workflow | Role |
|----------|------|
| `.github/workflows/ci.yml` | migrate drift, typecheck, lint, clinical tests, security, web build, Playwright e2e |
| `us-ai-worker.yml` / `us-ai-worker-fly.yml` | Docker smoke + optional Railway/Fly deploy |

CI uses placeholder Supabase URL (no live prod DB).

## 9. Data volume snapshot (prod tables, MCP)

| Table | Rows (approx) | Notes |
|-------|---------------|-------|
| `profiles` / `users` | 60 | Early user base |
| `patients` / `studies` | 0 | EMR empty in this project snapshot |
| `cases` | 15 | Teaching gallery |
| `messenger_*` | small | v2 messenger |
| `source_chunks` | 1 | Vault stub |
| `guidelines_external_index` | 13 | |
| `security_audit_log` | 57 | |
| `ai_chat_events` | 0 | Metering unused yet in prod |

## Problems (architecture layer)

| ID | File / evidence | Problem | Impact | Priority | Fix | Verify |
|----|-----------------|---------|--------|----------|-----|--------|
| ARCH-P2-01 | `apps/video` without package | Remotion pipeline broken in workspace | Cannot render marketing video from monorepo scripts | P2 | Restore `@repo/video` or remove root script | `pnpm dev:video` |
| ARCH-P2-02 | Dual migration trees | Drift risk web vs `packages/database` | Missed apply | P2 | Single SSOT process (`docs/architecture/migrations-source-of-truth.md`) | CI migration drift job |
| ARCH-P1-01 | Edge `verify_jwt: false` | Functions callable without JWT if URL leaked | Abuse of notify/reputation | P1 | Confirm secret auth; enable JWT or network restrict | Invoke without secret → 401 |
| ARCH-P2-03 | No staging branch | Migrations applied on main only | Higher blast radius | P2 | Supabase Pro branch or separate project | `list_branches` > main |
