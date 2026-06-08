# Medical Ultrasound SaaS — Architecture

## Product surfaces

| Route | Purpose |
|-------|---------|
| `/landing` | Public GE/Philips-inspired marketing shell |
| `/login`, `/register` | Supabase Auth (email/password + Google OAuth) |
| `/app` | Authenticated command center (module launcher) |
| `/calculators` | Calculator catalog → `/calculators/[slug]` worksheets |
| `/cases` | Teaching case feed + likes/bookmarks |
| `/cases/[caseId]` | Case detail + realtime comments |
| `/library` | Protocol/knowledge placeholders |
| `/uterus-3d` | `@clinical/uterus` shared R3F workspace (markers, FIGO) |
| `/workspace` | Existing AI imaging copilot (studies/series upload) |
| `/profile` | Supabase `profiles` reader |

## Folder structure (high level)

```
app/
  (clinical)/          # Shared authenticated shell (ClinicalShell)
    layout.tsx
    app/page.tsx
    calculators/
      [slug]/            # Supabase-backed worksheets
    cases/
    library/
    uterus-3d/
    workspace/
    profile/
    dashboard/          # Legacy redirect → /app
  landing/
  login/
  register/
  auth/callback/       # OAuth code exchange
  api/
    ai/structured-report/
components/
  clinical/clinical-shell.tsx
  cases/{case-feed,case-discussion}.tsx
  calculators/calculator-entry-form.tsx
  three/clinical-uterus-workspace.tsx
  ui/*                   # shadcn-style primitives (Button, Card, …)
lib/
  calculators/registry.ts
  ai/{orchestrator,structured-report}.ts
  copilot/*
utils/supabase/{client,server,middleware}.ts
supabase/migrations/*.sql
components.json            # shadcn/ui CLI schema (manual primitives today)

packages/clinical-uterus/        # @clinical/uterus — shared ProceduralUterus (also portable to Expo via Metro)
```

## Auth & security

- SSR Auth via `@supabase/ssr` + middleware session refresh (`utils/supabase/middleware.ts`).
- Protected prefixes enforced in root `middleware.ts`.
- OAuth completes at `/auth/callback` with PKCE cookies attached to the redirect response.
- **Before PHI:** tighten RLS, enable MFA, signed URLs for imaging buckets, BAA with Supabase.

## Realtime discussion

- Postgres tables `clinical_cases`, `case_comments`, `case_likes`, `case_bookmarks`.
- `case-feed.tsx` listens to `clinical_cases` changes; `case-discussion.tsx` listens to inserts filtered by `case_id`.
- Migration file adds tables to `supabase_realtime` publication.

## AI reporting

- Typed contract in `lib/ai/structured-report.ts`.
- Demo POST endpoint `app/api/ai/structured-report/route.ts` authenticates user and returns deterministic structured JSON — swap internals for your LLM + safety orchestrator (`lib/ai/orchestrator.ts`).

## Performance tactics

- Three.js island loaded via `next/dynamic` + `ssr:false`.
- `experimental.optimizePackageImports` for `lucide-react` + `@react-three/drei`.
- `transpilePackages: ["three"]` for bundler compatibility.
- Web Vitals: prefer route-level splitting, avoid heavy charts on first paint, monitor INP on mobile PWA.

## PWA

- `public/manifest.json`, `metadata.manifest` & Apple web app keys in `app/layout.tsx`.
- Service worker stub under `public/sw.js` — replace with Workbox strategy when offline caching requirements clear compliance review.

## Deployment (Vercel + Supabase)

1. Create Supabase project; configure **Authentication → Providers → Google** with OAuth redirect `https://YOUR_DOMAIN/auth/callback`.
2. Run SQL in `supabase/migrations/20260207180000_clinical_cases.sql`.
3. Set env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy Next.js app; set **sameSite** cookie policies if embedding.
5. Enable observability (Logflare, Datadog, OpenTelemetry) per enterprise policy.

This repository ships **clinical UX scaffolding**, not a certified medical device — complete regulatory/QA gates before patient use.
