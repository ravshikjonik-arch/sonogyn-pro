# Волна 4 — один чат (план)

**Цель:** mobile и web используют **Supabase discussions + web API**; **без** обязательного `apps/mobile/server` (chat-server) в production.

## Уже на Supabase (mobile)

- `CasesScreen` — лента **discussions** / teaching cases (`useDiscussionChannels`, `useTeachingCases`).
- `channel_subscriptions`, push navigation `discussions/case/<id>`.

## Ещё на legacy chat-server

| Функция | Файл | Замена |
|---------|------|--------|
| Telegram login nonce + poll + session | `chatBackend.ts` → `mobile/server/index.js` | Перенести pending nonce в Supabase KV/таблицу + web routes или вызов `verify-otp` / bot API напрямую |
| Старые `/cases` REST (JWT chat-server) | `chatBackend.ts` | **Не импортируется** в UI — кандидат на deprecate |
| `EXPO_PUBLIC_CHAT_API_URL` в EAS | `eas.json` не задаёт (prod) | Telegram deep link **ломается** без proxy — приоритет миграции |

## Web

- Обсуждения: `DoctorChannelChatV2`, messenger hooks.
- Auth Telegram: `/api/auth/telegram`, `/api/auth/telegram/bot`, `verify-otp`.

## Инкремент 4.1 (следующий PR)

1. `getChatApiBase()` fallback → `getWebApiBase()` только для `apiTelegramSupabaseSession` **после** web endpoint `POST /api/auth/telegram/mobile-session` (nonce exchange).
2. Док: prod **не** запускать `pnpm chat-server`.
3. E2E: guest discussions read-only; post требует login.

## Не ломать

- `openClinicalTool("chat_web")` → CasesTab discussions (уже так).
- App Store build 36 — не трогать auth flow до отдельного билда.