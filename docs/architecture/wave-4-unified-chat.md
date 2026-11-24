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

## Инкремент 4.1 — **на prod** (24.11.2026)

| Компонент | Путь |
|-----------|------|
| Таблица nonce | `packages/database/supabase/migrations/20261124130000_telegram_mobile_login_pending.sql` (prod OK) |
| Mobile API | `POST /api/auth/telegram/mobile/start`, `GET …/poll/[nonce]`, `POST …/session` |
| Bot | **Сценарий B:** webhook `https://sonogyn-pro.ru/api/telegram/hermes`, `login_` в Hermes (`bc7dbdf8`) |
| Mobile client | `chatBackend.ts` → web если нет `EXPO_PUBLIC_CHAT_API_URL` |

**Build 36:** бинарник **до** merge 4.1 — Telegram deep link на store **только** после **EAS 37** (`apps/mobile/docs/EAS-BUILD-37-CHECKLIST-RU.md`).

## Инкремент 4.2 — в работе

- **Сделано:** legacy JWT/cases REST → `apps/mobile/src/api/legacyChatServerClient.ts` (`@deprecated`).
- **Осталось:** E2E guest discussions read-only; post требует login (`apps/web/scripts/pilot-discussions-e2e.mjs`).

## Не ломать

- `openClinicalTool("chat_web")` → CasesTab discussions (уже так).
- App Store build 36 — не трогать auth flow до отдельного билда.