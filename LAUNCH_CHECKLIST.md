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
- [x] Rate limiting on Upstash / Vercel KV (`UPSTASH_REDIS_REST_*` or `KV_REST_API_*`); per-route presets in `apps/web/lib/security/rate-limit-config.ts`.
- [ ] Production rate limits tuned via Vercel env (`RATE_LIMIT_*`, see `apps/web/.env.example`).
- [ ] External FastAPI inference service stub replaced with signed VPC/VPN tunnel design.

## Rate limiting, bots & DDoS (production)

- [ ] Upstash Redis REST credentials on Vercel Production (required — без них API fail-closed).
- [ ] `AUTH_RATE_LIMIT_RELAXED` **не** задан на Production.
- [ ] `BOT_DETECTION_ENABLED` не отключён (по умолчанию блокирует scrapers на `/api/*`; allowlist: Stripe webhook, Telegram bot bridge).
- [ ] Vercel **Firewall** / **Attack Challenge Mode** включены для prod-домена (Dashboard → Project → Security).
- [ ] Cloudflare (если домен через CF): **Bot Fight Mode** или WAF managed rules для `/api/*`.
- [ ] Smoke: 429 + `Retry-After` на `/api/auth/sign-in` после лимита; поиск пациентов — dual limit IP + userId.
- [ ] Mobile offline flush: `flushAIQueue` с паузой 1.5s; burst на `/api/ai/orads` — `RATE_LIMIT_AI_ORADS_BURST` (default 5 / 10s).

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

### EAS Secrets (перед store build — не коммитить в репо)

Задайте через `eas secret:create` или Expo dashboard → **Project → Secrets** (профили `preview` / `production`).

| Secret | Назначение | В APK/IPA? |
|--------|------------|------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Да (ожидаемо; RLS) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon JWT | Да (ожидаемо; RLS) |
| `EXPO_PUBLIC_API_BASE_URL` | Production Next.js API | Да (URL) |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Firebase Analytics | Да (public) |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase | Да |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Firebase | Да |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | Firebase | Да |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat SDK (iOS) | Да (public SDK key) |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` | RevenueCat SDK (Android) | Да (public SDK key) |
| `EXPO_PUBLIC_TURNSTILE_SITE_KEY` | CAPTCHA site key | Да (public) |
| `EXPO_PUBLIC_AUTH_REDIRECT_SCHEME` | Deep link scheme | Да |

**Никогда в `EXPO_PUBLIC_*` / EAS client secrets:** `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `OPENROUTER_API_KEY`, `TELEGRAM_BOT_TOKEN`, `JWT_SECRET`, `SONOGYN_AUTH_INTERNAL_SECRET`.

Чеклист перед загрузкой в Store:

- [ ] Все `EXPO_PUBLIC_*` из `apps/mobile/.env.example` заданы в EAS для `production`.
- [ ] Локальный `.env` / `.env.development` не в git (`apps/mobile/.gitignore`).
- [ ] `eas build --profile production` без секретов в `eas.json` (только ссылки на EAS Secrets).
- [ ] После сборки: декомпиляция/smoke — нет service role / Stripe secret / OpenRouter в бандле.
- [ ] RevenueCat: ограничения по bundle id / package name в dashboard.
- [ ] Firebase: ограничить API key по Android package + iOS bundle id + SHA-1 (Play App Signing).
- [ ] Supabase: RLS включён на всех PHI-таблицах; anon key не даёт обхода политик.

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
