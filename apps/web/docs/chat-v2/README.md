# Doctor Chat v2 — rollout

Telegram-like reliability and UX on top of SonoGyn clinical stack. **v1** remains default until flags enable v2.

## Decisions (approved baseline)

| Topic | Choice |
|-------|--------|
| Realtime transport | **Supabase Realtime** + cursor API (extend case-discussion patterns) |
| E2E encryption | **Later**; TLS + RLS + PHI minimization in v1–v2 |
| Scope wave 1 | **Channel chat v2**, then DM/groups |
| Push | **Expo** first; Web Push — phase 8 |
| Rollback | `DOCTOR_CHAT_V2_ENABLED=false` → legacy `DoctorChannelChat` behaviour |

## Feature flags

| Variable | Side | Default |
|----------|------|---------|
| `DOCTOR_CHAT_V2_ENABLED` | server | off |
| `NEXT_PUBLIC_DOCTOR_CHAT_V2_ENABLED` | client | off |

Snapshot: `integrationRolloutSnapshot().doctorChatV2` (when wired to `/api/health`).

## Stage 8 — Push, E2E, k6, rollout (done)

- **Web Push**: `web_push_subscriptions` migration, `POST/GET /api/push/web-subscription`, `registerDoctorChatWebPush`, `MessengerPushControls` (Expo channel + Web). Edge `notify-new-chat-message` sends Web Push when VAPID secrets set; migration `20261023170000` wires v2 INSERT trigger.
- **Health**: `GET /api/health` → `rollout.doctorChatV2` (+ webPush, aiMention).
- **E2E**: `tests/e2e/doctor-chat-v2-smoke.spec.ts` (`test:e2e:doctor-chat-v2`).
- **k6**: `scripts/k6/messenger-chat-v2-smoke.js` (`test:k6:messenger-chat-v2`).
- **Rollout doc**: `docs/chat-v2/ROLLOUT.md`.

## Stage 7 — Clinical cards, moderation, @AI (done)

- **Clinical cards**: ссылки `/cases/{uuid}` в тексте → embed `MessengerClinicalCardEmbed` (`GET /api/messenger/case-card`).
- **Moderation**: таблица `messenger_message_reports` (migration `20261023150000_messenger_moderation.sql`), `POST /api/messenger/reports`, UI «Жалоба» на чужих сообщениях.
- **@AI**: `@AI` / `@ИИ` в composer → сообщение в чат + панель подсказки (`POST /api/messenger/ai-suggest`, без автопоста ответа). Флаги: `DOCTOR_CHAT_AI_MENTION_*`.
- **Tests**: `parse-clinical-links.test.ts`.

## Stage 6 — Media + PHI/EXIF (done)

- **Upload**: `prepareChatMediaUpload` — magic bytes (existing) + **EXIF strip** on JPEG/PNG/WebP (`/api/doctor-chat/media`).
- **PHI**: `rejectIfPhiInTextFields` on `POST /api/messenger/messages` and `POST /api/doctor-chat/messages`; client `detectPhi` in `useMessengerChannel`.
- **UX**: `MessengerMediaDisclaimer`, toast «метаданные удалены», `validateChatMediaUpload` before upload.
- **Smoke**: `node scripts/messenger-chat-v2-smoke.mjs` (auth/flag/PHI probes).
- **Tests**: `lib/chat/__tests__/prepare-chat-media-upload.test.ts`.

## Stage 5 — UI shell (done)

- **Split layout** (`MessengerCommunityChatShell`): sidebar каналов + чат на `lg`; на мобиле — список → чат с «Назад».
- **Timeline**: даты («Сегодня» / «Вчера»), группировка пузырей одного автора ≤5 мин (`build-message-timeline.ts`).
- **Scroll**: подгрузка истории (`beforeSeq`), сохранение позиции скролла; FAB «вниз» + счётчик непрочитанных внизу ленты.
- **Perf**: `content-visibility` + оценочное окно рендера (>60 строк) без новых npm-зависимостей.
- **iOS keyboard**: `useVisualViewportBottomInset` на composer.
- **Bundle**: `DoctorChannelChatV2Lazy` (`dynamic`, `ssr: false`).
- **Tests**: `build-message-timeline.test.ts`.

## Stage 4 — Realtime transport (done)

- **`useMessengerRealtime`**: один канал `messenger_room:{chatId}` — postgres INSERT/UPDATE + broadcast typing.
- **Incremental ingest**: fetch одного сообщения (`messageId`) вместо full reload; **gap fill** при пропуске `seq`.
- **Reconnect**: on `SUBSCRIBED` → `fillGap()`.
- **V1** `DoctorChannelChat`: polling **10 s** только если `REALTIME_POLLING_FALLBACK=true`; иначе ingest одной строки.
- **Typing**: broadcast «Коллега печатает…» (V2).
- **Tests**: `parse-message-row.test.ts`.

## Stage 3 — sync engine (done)

- **IndexedDB** `sonogyn-messenger-v1`: outbox + last-page cache.
- **`useMessengerChannel`**: resolve chat → cache hydrate → fetch; Realtime `messenger_messages` INSERT → gap fill (`afterSeq`).
- **Outbox flush** on `online` + after send; **same `clientUuid`** on retry (server idempotent).
- **UI**: `DoctorChannelChatV2` when `NEXT_PUBLIC_DOCTOR_CHAT_V2_ENABLED=true` — статусы ✓ / ✓✓ / «Повторить».
- **Tests**: `lib/messenger/sync/merge-messages.test.ts`.

Offline: **text** queued; **media** only online (toast).

## Stage 2 — schema & API (done)

**Migration:** `20261023120000_doctor_messenger_v2.sql`

Tables: `messenger_chats`, `messenger_chat_members`, `messenger_messages` (seq + `client_uuid`), `messenger_message_attachments`, `messenger_message_receipts`, `messenger_chat_counters`.

RPC:

- `messenger_ensure_channel_chat(legacy_channel_id)` → `chat_id`
- `messenger_send_message(...)` — idempotent on `(chat_id, client_uuid)`
- `messenger_backfill_doctor_channels()` — service_role; runs once in migration

**API** (404 unless `DOCTOR_CHAT_V2_ENABLED=true`):

- `GET /api/messenger/chats?legacyChannelId=<uuid>`
- `GET /api/messenger/messages?chatId=&beforeSeq=&limit=`
- `POST /api/messenger/messages` — body `{ chatId, clientUuid, body?, attachmentStoragePath?, ... }`

**Rollback:** leave flag off; v1 `doctor_chat_messages` unchanged. Drop v2 tables only after explicit cutover (separate down migration — not auto).

**Apply on Supabase:** `pnpm --filter @repo/database db:migrate` or SQL Editor copy from `packages/database/...`.

## Stage 1 — baseline (done)

- Guest/auth/access/migration panels (`DoctorChatLoadPanel`, `resolve-doctor-chat-load-state.ts`).
- Perf marks: `doctor_chat:open` (dev console: `[doctor-chat baseline] open_ms=`).
- Unit tests: `lib/chat/resolve-doctor-chat-load-state.test.ts`.

### How to measure (before v2 sync engine)

1. DevTools → Network: throttle **Fast 3G**, open `/cases?tab=chat` logged in.
2. Note **TTFB + full load** for `GET /api/doctor-chat/messages`.
3. Console: `open_ms` after first paint of messages.
4. Send text: time until bubble appears (v1: after POST returns — no optimistic UI).

**Targets (v2):** p95 send ≤300 ms online; open with cache ≤200 ms; 10k scroll ≥55 fps.

## Supabase migration inventory (doctor chat)

Apply in order on prod (packages/database):

1. `20260605130000_doctor_chat.sql` — channels, messages, bucket
2. `20260605140000_community_realtime.sql` — realtime publication
3. `20260605200000_doctor_presence.sql` — online roster
4. `20260624120000_doctor_discussions_extend.sql` — subscriptions, extra channels
5. `20260719120000_notify_new_chat_message.sql` — push webhook
6. `20260719133000_chat_push_cooldown.sql`
7. `20260731120000_medical_access_gate.sql` — **RLS community gate**
8. `20260830170000_case_discussions_v3.sql` — case threads + subscription RLS
9. `20260608120000_security_hardening.sql` — storage select via message row

Edge functions: `notify-new-chat-message` (Expo push).

**Prod check:** logged-in doctor → messages load; guest on `/cases` → login CTA (not “DB not connected”).

## Roadmap

| Stage | Focus |
|-------|--------|
| 1 | Flag, UX, baseline ✅ |
| 2 | Schema v2 + migration from channel messages ✅ |
| 3 | Outbox, optimistic UI, idempotent POST ✅ |
| 4 | Realtime incremental, drop 10s polling ✅ |
| 5 | UI shell + virtualization ✅ |
| 6 | Media + PHI/EXIF ✅ |
| 7 | Clinical cards, moderation, @AI ✅ |
| 8 | Push web, E2E, k6, rollout ✅ |
