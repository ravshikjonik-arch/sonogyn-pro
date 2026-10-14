# RLS test results — Case Discussions v3

> Статус: **локальные unit-тесты + матрица политик (без live Supabase в CI)**  
> Дата прогона: 2026-08-30  
> Миграция: `20260830170000_case_discussions_v3.sql` (**не применена на prod**)

## Unit tests (passed)

| Suite | File | Tests |
|-------|------|-------|
| Lifecycle state machine | `packages/types/src/case-discussions.test.ts` | 3/3 |
| Permission matrix | `apps/web/lib/cases/__tests__/discussion-permissions.test.ts` | 8/8 |

Команда:
```bash
pnpm --filter @repo/types test
pnpm --filter @repo/web test:security
```

## RLS policy checklist (manual / staging)

Выполнить на **staging branch** Supabase с JWT каждой роли.

| # | Сценарий | Role | Expected |
|---|----------|------|----------|
| 1 | SELECT comments чужого private draft | participant (other user) | **deny** (0 rows) |
| 2 | SELECT comments published public case | participant | **allow** via API/RLS |
| 3 | INSERT comment без medical access | student | **deny** |
| 4 | INSERT comment suspended user | suspended | **deny** |
| 5 | UPDATE comment text | any | **deny** (append-only) |
| 6 | hide comment RPC | participant | **deny** |
| 7 | hide comment RPC | moderator | **allow** |
| 8 | pin expert RPC | participant | **deny** |
| 9 | pin expert RPC | verified_doctor | **allow** |
| 10 | transition confirm без method | expert | **deny** (22023) |
| 11 | transition confirm other без note | expert | **deny** |
| 12 | resolve чужого кейса | participant | **deny** |
| 13 | subscribe private case без access | random user | **deny** |
| 14 | channel_subscriptions без doctor access | student | **deny** |
| 15 | SELECT hidden comment | participant | **deny** |
| 16 | SELECT hidden comment | moderator | **allow** |
| 17 | Direct client SELECT bypass API | anon | **deny** |
| 18 | Reaction на hidden comment | participant | **deny** |

## Bypass attempts documented

| Attack | Mitigation | Result |
|--------|------------|--------|
| Client forge `author_id` on INSERT | RLS `auth.uid() = author_id` | Blocked |
| Client set `is_pinned_expert=true` | Only RPC `pin_expert_case_comment` | Blocked |
| Client confirm case via UPDATE cases | RPC only + RLS | Blocked |
| Nested reply level 2 | Trigger `enforce_teaching_comment_depth` | Blocked |
| Subscribe without case access | RLS `can_access_case_discussion` | Blocked |

## Not covered in CI (staging TODO)

- Live Realtime delivery latency
- Edge Function push delivery
- Concurrent resolve + confirm race (RPC uses `FOR UPDATE`)

## Sign-off

- [ ] Staging migration applied
- [ ] Manual RLS matrix #1–18 executed
- [ ] Smoke: create case → comment → resolve → confirm → KB
