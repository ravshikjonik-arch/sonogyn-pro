# Telegram: уведомления админам (SonoGyn Pro)

## Как это работает в РФ

| Что | Нужен VPN? |
|-----|------------|
| **Уведомления админам** (сервер → Bot API) | **Нет** — запрос идёт с Vercel, не с телефона |
| **Вход пользователя** (вкладки Почта / Телефон / Google) | **Нет** |
| Telegram Login Widget в браузере | Может не работать без VPN — **не используем** в UI |

---

## Что уже настроено в коде

**Сервис:** `apps/web/services/telegram.ts`  
- `TelegramService.sendMessage(chatId, text)` — одному чату  
- `TelegramService.notifyAdmins(event, data)` — всем из `TELEGRAM_ADMIN_IDS`  
- `TelegramService.notifyAdminsSafe(...)` — fire-and-forget (не блокирует API)  
- Retry: `fetchWithRetry` (3 попытки, backoff) для `api.telegram.org`

**События, где уже вызывается админ-бот:**

| event | Файл | Когда |
|-------|------|--------|
| `user.created` | `app/api/auth/sign-up/route.ts`, `lib/auth/phone-custom-auth.ts` | Регистрация email / SMS |
| `sms.error` | `lib/auth/verification/send-verification-code.ts` | SMS.ru не доставил OTP (prod) |
| `payment.succeeded` | `lib/payment/fulfill-payment.ts` | Успешная оплата ЮKassa |
| `payment.error` | `lib/payment/handlers.ts` | Ошибка платежа |
| `course.enrollment` | `lib/courses/lms-notify.ts` | Запись на курс |
| `course.offline_registration` | `lib/courses/lms-notify.ts` | Офлайн-лекция |
| `api.error` | `services/logger.ts` | Критическая ошибка API |
| `daily.summary` | `app/api/cron/daily-summary/route.ts` | Cron 06:00 UTC — сводка за 24 ч |

**Фасад для внутренних вызовов:** `POST /api/notify`  
Тело: `{ "event": "...", "message": "...", "metadata": {} }`

---

## Переменные окружения

```env
# Обязательно для admin-бота
TELEGRAM_BOT_TOKEN=7123456789:AAH...
TELEGRAM_ADMIN_IDS=123456789,-1001234567890

# Опционально (legacy, один ID)
TELEGRAM_ADMIN_CHAT_ID=
TELEGRAM_PAYMENTS_CHAT_ID=

# Cron + защита /api/notify (production обязателен)
CRON_SECRET=openssl rand -hex 32

# Альтернатива для server-to-server
SONOGYN_AUTH_INTERNAL_SECRET=

# Username бота (для Login Widget, не для admin push)
TELEGRAM_BOT_USERNAME=your_bot
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot
```

**Vercel:** Project → Settings → Environment Variables → Production + Preview.

---

## 1. Создать бота (@BotFather)

1. Telegram → **@BotFather** → `/newbot`
2. Скопируйте **HTTP API Token** → `TELEGRAM_BOT_TOKEN`

---

## 2. Получить chat_id

**Личный чат:**

1. Нажмите **Start** у бота
2. `https://api.telegram.org/bot<TOKEN>/getUpdates`
3. `"chat":{"id":123456789}` → `TELEGRAM_ADMIN_IDS=123456789`

**Группа админов:** id обычно отрицательный (`-100...`).

Несколько ID — через запятую, точку с запятой или пробел.

---

## 3. Проверка работы

### A. Диагностика (без секретов)

```bash
curl -s http://localhost:3000/api/auth/status | jq '.features | {telegramNotifyConfigured, telegramAdminCount}'
```

Ожидание при правильном env:

```json
{ "telegramNotifyConfigured": true, "telegramAdminCount": 1 }
```

### B. Прямая отправка (скрипт)

```bash
node apps/web/scripts/test-telegram-admin.mjs
```

Должно прийти: **«✅ Админ-бот работает»**

### C. Через /api/notify

```bash
node apps/web/scripts/test-telegram-admin.mjs --via-api http://localhost:3000
```

Нужен `CRON_SECRET` в `.env.local` (или dev без секрета).

### D. Cron daily-summary

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/daily-summary
```

Данные: `profiles` (регистрации), `payments`, счётчики ошибок из `logger`.

**Vercel Cron:** `apps/web/vercel.json` → `0 6 * * *` (06:00 UTC).

---

## 4. Добавить новое уведомление

```typescript
import { TelegramService } from "@/services/telegram";

// Не блокирует ответ API:
TelegramService.notifyAdminsSafe("payment.succeeded", {
  userId: "...",
  amountRub: 990,
});

// С ожиданием результата:
const { sent, total } = await TelegramService.notifyAdmins("api.error", {
  route: "/api/foo",
  message: "краткое описание",
});
```

Кастомное событие (любая строка `event`):

```typescript
TelegramService.notifyAdminsSafe("moderation.flagged", {
  caseId: "...",
  reason: "спам",
});
```

Или через HTTP:

```bash
curl -X POST http://localhost:3000/api/notify \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event":"admin.test","message":"Тест","metadata":{"foo":"bar"}}'
```

---

## 5. Troubleshooting

| Симптом | Решение |
|---------|---------|
| `telegramNotifyConfigured: false` | Задайте `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ADMIN_IDS` |
| `403 Forbidden` / `chat not found` | Напишите боту `/start` |
| `401 Unauthorized` на `/api/notify` | Задайте `CRON_SECRET` на Vercel |
| Сообщения не приходят на prod | Env только в Vercel Production, redeploy |
| Cron не срабатывает | Vercel Pro для crons; проверьте `CRON_SECRET` |

---

## Код

- Сервис: `apps/web/services/telegram.ts`
- Auth internal: `apps/web/lib/security/internal-notify-auth.ts`
- Notify API: `apps/web/app/api/notify/route.ts`
- Тест: `apps/web/scripts/test-telegram-admin.mjs`
