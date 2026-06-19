# Telegram: уведомления админам (SonoGyn Pro)

## Как это работает в РФ

| Что | Нужен VPN? |
|-----|------------|
| **Уведомления админам** (сервер → Bot API) | **Нет** — запрос идёт с Vercel, не с вашего телефона |
| **Вход пользователя** (вкладки Почта / Телефон / Google) | **Нет** |
| Telegram Login Widget в браузере | Может не работать без VPN — **не используем** в UI |

Вкладки на `/login` и `/register`: **Почта**, **Телефон**, **Google** — все подключены к API приложения.

---

## 1. Создать бота (@BotFather)

1. Откройте Telegram (на телефоне с APN или через VPN — один раз).
2. Найдите **@BotFather** → `/newbot`.
3. Задайте имя и username (например `sonogyn_admin_bot`).
4. BotFather пришлёт **HTTP API Token** вида `7123456789:AAH...`.

---

## 2. Получить chat_id

**Личный чат с ботом:**

1. Нажмите **Start** у вашего бота.
2. Откройте в браузере:

   `https://api.telegram.org/bot<ВАШ_TOKEN>/getUpdates`

3. В JSON найдите `"chat":{"id":123456789}` — это ваш `chat_id`.

**Группа админов:**

1. Создайте группу, добавьте бота.
2. Напишите сообщение в группу.
3. Снова `getUpdates` — `id` группы обычно отрицательный (например `-1001234567890`).

---

## 3. Переменные окружения (Vercel / `.env.local`)

```env
TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_ADMIN_IDS=123456789,-1001234567890
```

Несколько ID — через запятую.

Legacy (один админ): `TELEGRAM_ADMIN_CHAT_ID` тоже поддерживается.

---

## 4. События

| event | Когда |
|-------|--------|
| `user.created` | Регистрация email или новый пользователь по SMS |
| `payment.succeeded` | Webhook ЮKassa `payment.succeeded` |
| `sms.error` | Не удалось отправить SMS (sms.ru) |
| `payment.error` | Ошибка создания платежа или webhook |

---

## 5. Проверка

```bash
curl -s "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -d chat_id=<ADMIN_ID> \
  -d text="SonoGyn Pro: тест уведомлений"
```

После деплоя: зарегистрируйте тестового пользователя — админам должно прийти сообщение.

---

## Код

Сервис: `apps/web/services/telegram.ts`

```typescript
import { TelegramService } from "@/services/telegram";

TelegramService.notifyAdminsSafe("user.created", { userId, email });
await TelegramService.sendMessage(chatId, "текст");
```
