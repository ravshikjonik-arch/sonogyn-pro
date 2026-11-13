# 03 — Database & Storage Audit

**Project:** `grnwcbyslttbrqznnunq` · Postgres 17.6 · `eu-west-1`  
**Advisors snapshot:** `_advisor_snapshot.json` (MCP `get_advisors` 2026-11-04)

## 1. Performance advisors (live)

| Lint | Level | Count | Meaning |
|------|-------|------:|---------|
| `unindexed_foreign_keys` | INFO | 78 | FK without covering index |
| `auth_rls_initplan` | WARN | 171 | `auth.uid()` re-eval per row — classic Supabase lint |
| `unused_index` | INFO | 84 | Candidates to drop after traffic grows (Stage3 indexes may show unused while traffic low) |
| `multiple_permissive_policies` | WARN | 72 | Multiple permissive policies OR’d — planner cost |

## 2. Connection pooling

| Pattern | Path | Assessment |
|---------|------|------------|
| PostgREST via Supabase JS | `utils/supabase/server.ts`, `client.ts`, `admin.ts`, `user-scoped.ts` | Primary clinical I/O |
| Prisma | `apps/web/lib/prisma.ts` | Ops/secondary; comment: clinical not via Prisma |
| Pooler URL | `.env.example` `:6543?pgbouncer=true` | Correct pattern |
| Health flag | `/api/health` `databaseUrlPooled` | Detects pooler substring |

**Bottleneck:** serverless creates many short-lived clients; scale depends on **Supabase pooler limits**, not Node `pg` pool. No app-side connection storm mitigation beyond PostgREST.

## 3. Indexes (Stage 3 — applied)

Migration: `packages/database/supabase/migrations/20261104120000_stage3_perf_indexes.sql`  
Prod name: `stage3_perf_indexes` (applied 2026-11-04).

Covers: `ai_chat_events` (user/success/created), evidence/rag logs, guidelines, patients list, analytics, messenger chats, RPC `claim_regulation_ingest_jobs` (`FOR UPDATE SKIP LOCKED`, **service_role only**).

**Gap:** 78 unindexed FKs remain (advisor). Prioritize hot paths: `ai_chat_messages.user_id`, messenger FKs, case discussion FKs — when traffic appears.

## 4. Slow queries

- Live `pg_stat_statements` top queries **not** dumped (would need `execute_sql` — out of scope without explicit OK).
- Expected hotspots from code:
  - Daily quota scan of `ai_chat_events` (JS aggregate).
  - Evidence history / bookmarks.
  - Messenger inbox by `updated_at` (index added Stage3).
  - RLS initplan on large tables (171 findings).

## 5. RLS

- EMR tables: RLS enabled; own-row patterns in clinical schema migrations.
- Teaching `cases`: comment “anonymized educational cases only”; publish gate `enforce_case_publish_media_anon`.
- `user_metadata`: RLS **enabled but no policies** (advisor INFO) — table locked to service_role historically (`20260614120000_user_metadata_lookup.sql`); verify no client access.
- **P1:** `profiles_select_authenticated USING (true)` — `20261022_verification_reputation.sql` L353–355.

## 6. IDOR

| Layer | Status |
|-------|--------|
| API patients/studies | `.eq("created_by", user.id)` + `assertStudyOwnedByUser` |
| Contract tests | `lib/security/__tests__/emr-access-contract.test.ts` |
| Risk | New routes forgetting auth (no global API middleware) |

## 7. Storage access

| Bucket (migrations) | Policy theme |
|---------------------|--------------|
| `ultrasound-media` | Path `{user_id}/…` |
| `doctor-chat-media` | Community access + ownership |
| `teaching_case_media` | Teaching gallery |
| `verifications` | Direct SELECT dropped (signed URL) |
| `medical-source-vault` | Knowledge editors |

Objects ~1799 — growth mostly media, not EMR rows (patients=0).

## 8. Backup / PITR / growth

| Topic | Evidence in repo/MCP | Gap |
|-------|----------------------|-----|
| PITR | Not readable via used MCP tools | Confirm in Supabase dashboard (plan feature) |
| Backups | Managed Supabase | Document RPO/RTO in ops runbook |
| Growth | Low row counts now | Storage objects will dominate before PG rows |
| Realtime | Messenger/cases/presence tables present | Watch connection quotas at 1k+ concurrent |

## 9. Vector / Realtime

- `vector` installed; `source_chunks` 1 row; **no** vector indexes in migrations.
- `storage.buckets_vectors` / `vector_indexes` empty (0 rows).
- Realtime: doctor presence, messenger, case discussion — scale with concurrent subscribers.

## Critical bottlenecks

1. **RLS initplan ×171** — CPU on large tables when EMR fills.
2. **Unindexed FKs ×78** — join/delete cascades.
3. **Quota query pattern** — app-side aggregation.
4. **No staging** — index experiments risk prod.
5. **Multiple permissive policies ×72** — consolidate where possible.

## Findings table

| ID | Evidence | Problem | Impact | Priority | Solution | Verify |
|----|----------|---------|--------|----------|----------|--------|
| DB-P1-01 | Advisors SECURITY DEFINER (see 04) | Cross-cut | Privilege | P1 | See security doc | Advisor recount |
| DB-P1-02 | `profiles` policy | Overbroad SELECT | PII leak among users | P1 | Restore roster policy | Cross-user select fails |
| DB-P2-01 | 78 unindexed FKs | Slow joins/cascades | P2 | Index hot FKs on staging | Advisor count ↓ |
| DB-P2-02 | 171 auth_rls_initplan | Per-row `auth.uid()` | P2 | `(select auth.uid())` pattern | Advisor count ↓ |
| DB-P2-03 | 72 multiple permissive | Planner overhead | P2 | Merge policies | Advisor |
| DB-P3-01 | 84 unused_index | Write amplification risk | P3 | Drop after 30d traffic baseline | pg_stat |
| DB-P2-04 | No PITR doc | Unknown RPO | P2 | Dashboard checklist + runbook | Ops sign-off |
| DB-P3-02 | `user_metadata` RLS no policy | Confused posture | P3 | Explicit deny policy or document service-only | Advisor INFO clear |

## Safe load-test DB method (staging only)

1. Separate Supabase branch/project with **synthetic** doctors (no real PHI).
2. Seed N patients/studies with faker IDs.
3. k6 against staging API with auth tokens (see `apps/web/scripts/k6/`).
4. Capture `pg_stat_statements` top 20 before/after.
5. Never point load generators at prod URL.
