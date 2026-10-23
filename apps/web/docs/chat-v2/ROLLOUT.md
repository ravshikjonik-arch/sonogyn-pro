# Doctor Chat v2 — rollout checklist

## Migrations (Supabase, in order)

1. `20261023120000_doctor_messenger_v2.sql`
2. `20261023150000_messenger_moderation.sql`
3. `20261023160000_web_push_subscriptions.sql` (Web Push)
4. `20261023170000_messenger_push_webhook.sql` (push trigger for v2)

## Staging flags

```env
DOCTOR_CHAT_V2_ENABLED=true
NEXT_PUBLIC_DOCTOR_CHAT_V2_ENABLED=true
DOCTOR_CHAT_WEB_PUSH_ENABLED=true          # optional
NEXT_PUBLIC_DOCTOR_CHAT_WEB_PUSH_ENABLED=true
NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=...
# VAPID private key — Supabase Edge secret only, not in git
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_VAPID_PUBLIC_KEY=...   # same as NEXT_PUBLIC_*
WEB_PUSH_VAPID_SUBJECT=mailto:support@sonogyn-pro.ru
```

Redeploy Edge Function `notify-new-chat-message` after pull (v1 + v2 + Web Push).

**Automated sync (Vercel public + Supabase Edge secrets):**

```bash
# Account → Access Tokens → SUPABASE_ACCESS_TOKEN in apps/web/.env.local
pnpm --filter @repo/web setup:web-push-vapid -- --apply
```

Generates or reuses `.vapid-setup.local.json` (gitignored). Rotating keys requires PWA re-subscribe.

## Verify

| Step | Command / action |
|------|------------------|
| Smoke HTTP | `npm run test:messenger-v2-smoke` |
| Unit | `node --import tsx --test lib/messenger/ui/*.test.ts` |
| Playwright | `pnpm --filter @repo/web exec playwright test tests/e2e/doctor-chat-v2-smoke.spec.ts --project=chromium-no-auth` |
| k6 | `k6 run scripts/k6/messenger-chat-v2-smoke.js -e BASE_URL=https://staging…` |
| Health | `curl -s /api/health \| jq .rollout.doctorChatV2` |

## Prod promotion

1. Migrations applied on prod branch.
2. Enable flags for 5–10% staff accounts (manual env on preview first).
3. Monitor: messenger 5xx, `doctor_chat:open` baseline, moderation queue `messenger_message_reports`.
4. Rollback: `DOCTOR_CHAT_V2_ENABLED=false` → v1 UI and API 404 on `/api/messenger/*`.

## Push matrix

| Channel | Mechanism |
|---------|-----------|
| Expo mobile | `user_push_tokens` + edge `notify-new-chat-message` (v1 table) |
| Web PWA | `web_push_subscriptions` + **future** sender (VAPID private) |
| In-app | Supabase Realtime `messenger_messages` |
