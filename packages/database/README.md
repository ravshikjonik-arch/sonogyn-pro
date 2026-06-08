# @repo/database

Versioned Postgres migrations for the ultrasound SaaS platform.

## Apply

```bash
# From repo root (linked Supabase project)
supabase db push

# Or paste SQL files in order into Supabase Dashboard → SQL → New query
```

**Source of truth:** `packages/database/supabase/migrations/*.sql`

Apply SaaS core first (`20260208100000_saas_platform_core.sql`), then teaching-gallery social tables (`20260210120000_teaching_social_on_cases.sql`). Legacy `clinical_cases` migrations remain for older demos only.

Duplicate migrations are mirrored under `apps/web/supabase/migrations/` so teams running CLI only against the Next app stay aligned — prefer consolidating edits here then copying into `apps/web` when iterating locally.
