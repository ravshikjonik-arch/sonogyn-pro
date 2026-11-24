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

## Инкремент 4.1 — **сделано в коде** (нужен deploy + миграция)

| Компонент | Путь |
|-----------|------|
| Таблица nonce | `packages/database/supabase/migrations/20261124130000_telegram_mobile_login_pending.sql` |
| Mobile API | `POST /api/auth/telegram/mobile/start`, `GET …/poll/[nonce]`, `POST …/session` |
| Bot webhook | `POST /api/telegram/auth-login-webhook` (настроить в BotFather → webhook URL) |
| Mobile client | `chatBackend.ts` → `getWebApiBase()` если нет `EXPO_PUBLIC_CHAT_API_URL` |

**Ops после merge:**

1. Применить миграцию на Supabase staging/prod.
2. Vercel env: `TELEGRAM_LOGIN_WEBHOOK_SECRET` (или `TELEGRAM_WEBHOOK_SECRET`).
3. Telegram: `setWebhook` → `https://sonogyn-pro.ru/api/telegram/auth-login-webhook` + secret header.
4. Prod **не** держать `apps/mobile/server` для пилота.

**Build 36 (App Store):** deep-link Telegram заработает на **текущем** бинарнике после deploy+миграции (useAuthDeepLinks уже вызывает `apiTelegramSupabaseSession`).

## Инкремент 4.2 (далее)

- Deprecate неиспользуемые `apiRegister` / cases REST в `chatBackend.ts`.
- E2E: guest discussions read-only; post требует login.

## Не ломать

- `openClinicalTool("chat_web")` → CasesTab discussions (уже так).
- App Store build 36 — не трогать auth flow до отдельного билда.