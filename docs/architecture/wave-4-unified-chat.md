# Волна 4 — один чат (план)

**Цель:** mobile и web используют **Supabase discussions + web API**; **без** обязательного `apps/mobile/server` (chat-server) в production.

## Уже на Supabase (mobile)

- `CasesScreen` — лента **discussions** / teaching cases (`useDiscussionChannels`, `useTeachingCases`).
- `channel_subscriptions`, push navigation `discussions/case/<id>`.

## Legacy chat-server (dev only)

| Функция | Статус |
|---------|--------|
| Telegram mobile login | **Prod:** web API + Hermes `login_` |
| JWT `/cases` REST | **`legacyChatServerClient.ts`** (`@deprecated`); UI не использует |
| `EXPO_PUBLIC_CHAT_API_URL` | Только локальный `apps/mobile/server` |

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

## Инкремент 4.2 — **готово в коде**

- Legacy JWT/cases REST → `legacyChatServerClient.ts`.
- `pilot-discussions-e2e.mjs` — web↔web thread OK.
- Playwright: `tests/e2e/discussions-guest-smoke.spec.ts` (guest hub + POST `/api/cases` gated).

## Не ломать

- `openClinicalTool("chat_web")` → CasesTab discussions (уже так).
- App Store build 36 — не трогать auth flow до отдельного билда.