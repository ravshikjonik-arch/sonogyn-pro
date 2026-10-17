# @repo/database

Versioned Postgres migrations — **mirror** of the web SSOT.

## Source of truth

**Authoritative path:** `apps/web/supabase/migrations/`  
See `docs/architecture/migrations-source-of-truth.md`.

This package exists so teams can run `supabase db push` from a dedicated folder and to document the SaaS schema. **Do not edit SQL here first.**

## Sync mirror from web

```bash
pnpm --filter @repo/database sync-from-web
pnpm check:migration-drift   # from repo root — must pass before merge
```

## Apply (staging / manual)

```bash
# From repo root (linked Supabase project — staging only unless explicitly approved)
supabase db push

# Or paste files in order into Supabase Dashboard → SQL (prefer apps/web bundle)
cd apps/web && npm run db:bundle
```

Apply SaaS core first (`20260208100000_saas_platform_core.sql`), then teaching-gallery social tables. Legacy `clinical_cases` migrations remain for older demos only.
