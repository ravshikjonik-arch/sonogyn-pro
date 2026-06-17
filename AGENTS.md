# AGENTS.md

SonoGyn Pro — pnpm + Turborepo monorepo. Apps: `apps/web` (Next.js 16), `apps/mobile` (Expo), `apps/mobile/server` (Express chat API). Shared libs in `packages/*`. See `README.md` and `TERMINAL.md` for product/run details.

## Cursor Cloud specific instructions

Dependencies are already installed by the startup update script (`pnpm install` at root; `npm install` in `apps/mobile/server`). Node 22 / pnpm 10.6.5 are available. Notes for running and validating:

- Primary product to demo end-to-end is the **web app** (`apps/web`). Run it with `pnpm --filter @repo/web dev` (Turbopack, port `3000`). Standard scripts live in `apps/web/package.json` and root `package.json`.
- The web app needs a Supabase backend for auth/data. For local UI/feature testing without a real backend, create `apps/web/.env.local` (gitignored) with `DEV_SKIP_AUTH=true` plus placeholder `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_APP_URL`. This unlocks the doctor cabinet (`/app`) and the calculators (e.g. `/calculators/elastography`) which compute fully client-side — a good no-backend smoke test. Patient CRUD and login flows still require real Supabase credentials.
- `next build` requires the same `NEXT_PUBLIC_SUPABASE_*` + `NEXT_PUBLIC_APP_URL` env vars to be set (the CI workflow uses placeholders). To reproduce CI build: `pnpm exec turbo build --filter=@repo/web` with those vars exported.
- **Pre-existing failures (not environment issues):** `pnpm typecheck` fails in `@repo/mobile` (`src/hooks/useSessionRevalidation.ts` null check) and `pnpm lint` reports errors in `@repo/web` / `apps/web/packages/clinical-uterus`. CI on `main` is already red because of these. The web app's own `pnpm --filter @repo/web typecheck` passes. Do not "fix" these unless asked.
- Chat/community API (`apps/mobile/server`, port `3100`) is an isolated **npm** package (not in the pnpm workspace). Run with `npm --prefix apps/mobile/server start`. Dev has a built-in JWT fallback; `JWT_SECRET` is only required when `NODE_ENV=production`.
- Mobile (`apps/mobile`, Expo, port `19001`): `pnpm --filter @repo/mobile start`. Native/device features need real Firebase/Supabase keys.
- `products/sonogyn-pro/` is an archive snapshot — not part of the pnpm workspace; do not run it.
