# Launch readiness checklist

Use this as the human-facing gate before exposing the platform to clinicians or SaMD validation artifacts.

## Repository & monorepo

- [ ] `pnpm install` succeeds from repository root (`pnpm@10.6.5` via `packageManager` field).
- [ ] Workspace packages resolve: `@repo/types`, `@repo/ui`, `@repo/database`, `@repo/web`, `@repo/mobile`.
- [ ] Duplicate migration mirrors stay aligned: `packages/database/supabase/migrations/` ↔ `apps/web/supabase/migrations/` for whichever CLI path you standardize on.

## Environment files

- [ ] Root `.env.example` reviewed for CI parity.
- [ ] `apps/web/.env.example` copied to Vercel Production / Preview with scoped secrets only on server.
- [ ] `apps/mobile/.env.example` copied into Expo / EAS secrets (`EXPO_PUBLIC_*` only on client).

## Supabase

- [ ] SQL migrations applied (`profiles`, `cases`, `case_media`, `ai_analyses`, `subscriptions`, `analytics_events`, `audit_log`, …).
- [ ] Row Level Security validated with representative JWTs (user / moderator / admin).
- [ ] Auth trigger `handle_new_user_profile` provisions profiles + `trial_ends_at`.
- [ ] Audit triggers firing on `profiles`, `cases`, `subscriptions`.
- [ ] Storage buckets + virus-scan integration designed (placeholder acceptable pre-prod).
- [ ] Business Associate Agreement executed where PHI will transit (Supabase + Vercel + Stripe + Firebase vendors).

## Stripe & billing

- [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs configured.
- [ ] Webhook endpoint `/api/stripe/webhook` registered in Stripe Dashboard (production URL).
- [ ] `/api/stripe/create-checkout` smoke-tested with trial metadata propagation.
- [ ] `/api/stripe/restore` verified against multi-device entitlement hydration.
- [ ] RevenueCat / native IAP bridge documented if bypassing Stripe on mobile stores.

## AI & quotas

- [ ] `/api/ai/analyze` mocked pipeline completes ~30s delay using `after()` + service-role updates.
- [ ] Rate limiting swapped from in-memory buckets to Upstash / Vercel KV before horizontal scale.
- [ ] External FastAPI inference service stub replaced with signed VPC/VPN tunnel design.

## Web (Next.js)

- [ ] Production build uses webpack (`next build --webpack`) because `@ducanh2912/next-pwa` injects webpack plugins while Next 16 defaults to Turbopack.
- [ ] CSP tightened from `Content-Security-Policy-Report-Only` to enforcing policy once asset hosts finalized.
- [ ] `/manifest.webmanifest` ships acceptable clinical-safe icons (replace SVG placeholder).
- [ ] Lighthouse ≥ 90 on `/landing` + `/app` after icon/CDN tuning.

## Mobile (Expo)

- [ ] `metro.config.js` watches monorepo root for `@repo/types`.
- [ ] `SupabaseAuth` deep link `auth/supabase` documented for QA.
- [ ] EAS Build profiles sign Android `.aab` / future iOS IPA.
- [ ] EAS Update channels (`preview`, `production`) aligned with Git branches.

## Observability & analytics

- [ ] Firebase Analytics measurement IDs differ between web GA4 property vs mobile property.
- [ ] Supabase `analytics_events` ingestion pathway chosen (direct insert vs edge queue).
- [ ] Sentry DSNs wired (`NEXT_PUBLIC_SENTRY_DSN`, native SDK) — stubs removed.

## CI/CD

- [ ] GitHub Actions workflow passes: install → typecheck → lint → web build (see `.github/workflows/ci.yml`).
- [ ] Vercel Git integration: preview deployments per PR; production pinned to `main`.
- [ ] Vercel **Root Directory** = `apps/web` (не корень репо). Включить *Include source files outside of the Root Directory*.
- [ ] Vercel install = `pnpm` (см. `apps/web/vercel.json`), не `npm install` / `turbo run build` из авто-детекта.
- [ ] Branch protections require green CI.

## Legal & compliance UX

- [ ] Privacy Policy / Terms updated for telemetry + cookies.
- [ ] Cookie consent (Usercentrics or equivalent) loads before non-essential trackers.
- [ ] `public/.well-known/security.txt` points at operational security inbox + rotation owners.

## Launch runbook

- [ ] Rollback plan documented (disable Stripe webhook; revert Vercel deployment; freeze Supabase writes).
- [ ] On-call roster + escalation path for auth outages vs billing outages.
- [ ] Dashboard links: Supabase metrics, Vercel observability, Stripe Radar, Firebase conversions.
