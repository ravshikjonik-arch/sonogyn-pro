# Phase A — Ops checklist (GO-SEC-A)

**Дата:** 2026-11-04  
**Код в репо:** fail-closed quota, `AUTH_RATE_LIMIT_RELAXED` prod guard, миграции-черновики A4/A5.  
**Не сделано автоматически:** Vercel env, Supabase Auth HIBP, apply SQL на prod.

## A1 — Open access off (Vercel)

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Project `sonogyn-pro-web` → Env → Production | `NEXT_PUBLIC_OPEN_ACCESS_FULL=false` |
| 2 | Optionally set `OPEN_ACCESS_FULL=false` | Same |
| 3 | Redeploy production | — |
| 4 | Smoke unauth | `POST /api/ai/chat` without session → **401** |

## A2 — Leaked password protection (Supabase Auth)

| Шаг | Действие | Ожидание |
|-----|----------|----------|
| 1 | Supabase Dashboard → Authentication → Providers → Email | Enable **Prevent use of leaked passwords** |
| 2 | Advisors security | Auth HIBP warning cleared |

**Проверка 2026-11-04 (Management API):** `password_hibp_enabled=false`, PATCH → **402**  
«available on Pro Plans and up». На текущем тарифе проекта **включить нельзя**, пока нет Pro (или выше).  
Временный hardening без Pro: `password_min_length` ≥ 8 (+ required characters в Auth Email).

## A3 — Rate limit / secrets (prod)

| Проверка | Ожидание |
|----------|----------|
| `AUTH_RATE_LIMIT_RELAXED` | **отсутствует** или не `true` (deploy throw via `production-secrets`) |
| Upstash REST | `UPSTASH_REDIS_REST_*` или `KV_REST_API_*` set |
| `SUPABASE_SERVICE_ROLE_KEY` | set (иначе AI quota fail-closed) |
| `GET /api/health` | green |

## A4 / A5 — SQL

**Applied on prod** `Sonogyn-Pro` (`grnwcbyslttbrqznnunq`) 2026-11-04 (явный GO «примени миграцию»):

| MCP name | Repo file |
|----------|-----------|
| `phase_a_profiles_roster` | `…/20261104160000_phase_a_profiles_roster.sql` |
| `phase_a_definer_revoke` | `…/20261104161000_phase_a_definer_revoke.sql` |
| `phase_a_badges_revoke_anon` | revoke EXECUTE on badges RPC from `anon` |

Staging branch отсутствовал (только `main`) — применено на default.

После apply:

- User A cannot `select * from profiles where id = B`.
- Badges: `rpc get_author_public_badges`.
- `apply_moderation_penalty` — только service_role (+ Next admin route).

## A7 — Edge functions auth review

| Function | Check | Pass when |
|----------|-------|-----------|
| Each Edge with `verify_jwt: false` | Shared secret / cron header required | Unauthorized invoke → 401 |
| Secrets rotation | Not in git; dashboard only | — |

## Verification (repo)

```bash
pnpm --filter @repo/web test:security
pnpm --filter @repo/web typecheck
```

## Status board

| ID | In repo | Prod / dashboard |
|----|---------|------------------|
| A6 quota fail-closed | done | SRK present; health ok |
| A3 AUTH_RATE_LIMIT guard | done | ensure env not set |
| A4 profiles roster | done + applied prod | done |
| A5 DEFINER revoke | done + applied prod | done |
| A1 open-access | done | Vercel `false` + redeploy; unauth AI 401 |
| A2 HIBP | API tried | **blocked: needs Supabase Pro** (402); min password raised to 8 |
| A7 Edge JWT | checklist | manual |
