# Telegram webhook — mobile вход `login_{uuid}`

У **одного** бота — **один** webhook URL. Код обрабатывает `login_` и на `/api/telegram/auth-login-webhook`, и на `/api/telegram/hermes` (если Hermes на том же `TELEGRAM_BOT_TOKEN`).

---

## 1. Секрет (один раз)

На Mac сгенерируйте случайную строку (не коммитить):

```bash
openssl rand -hex 24
```

**Vercel** → проект `sonogyn-pro-web` → Settings → Environment Variables → **Production**:

| Key | Value |
|-----|--------|
| `TELEGRAM_LOGIN_WEBHOOK_SECRET` | строка из `openssl` |
| `TELEGRAM_BOT_TOKEN` | уже есть (статус: задан) |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | уже есть |

Если webhook уже стоит на **Hermes** — можно **не** менять URL: добавьте тот же секрет в `TELEGRAM_LOGIN_WEBHOOK_SECRET` **или** оставьте только `TELEGRAM_HERMES_WEBHOOK_SECRET` на Hermes URL (login_ обрабатывается в коде Hermes).

После добавления env — **Redeploy** production.

---

## 2. Узнать username бота

В Connect/Expo не нужно. Смотрите `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` в Vercel (без `@`).

---

## 3. Поставить webhook (выберите сценарий)

### A — Только вход (отдельный URL)

```bash
export TELEGRAM_BOT_TOKEN='***'          # из Vercel, не в чат
export TELEGRAM_LOGIN_WEBHOOK_SECRET='***'

curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -d "url=https://sonogyn-pro.ru/api/telegram/auth-login-webhook" \
  -d "secret_token=${TELEGRAM_LOGIN_WEBHOOK_SECRET}" \
  -d "allowed_updates[]=message"
```

### B — Уже настроен Hermes на том же боте (рекомендуется)

Оставьте URL:

`https://sonogyn-pro.ru/api/telegram/hermes`

и секрет `TELEGRAM_HERMES_WEBHOOK_SECRET`. Команда `/start login_<uuid>` обрабатывается в Hermes.

### C — Два бота (Hermes token отдельный)

| Бот | URL |
|-----|-----|
| Вход (`TELEGRAM_BOT_TOKEN`) | `/api/telegram/auth-login-webhook` + `TELEGRAM_LOGIN_WEBHOOK_SECRET` |
| Hermes (`TELEGRAM_HERMES_BOT_TOKEN`) | `/api/telegram/hermes` + `TELEGRAM_HERMES_WEBHOOK_SECRET` |

---

## 4. Проверка

```bash
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool
```

Ожидание: `url` = выбранный endpoint, `last_error_message` пусто.

**API живой** (без секрета → 403):

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  -H "Content-Type: application/json" \
  -d '{}' https://sonogyn-pro.ru/api/telegram/auth-login-webhook
# 403
```

---

## 5. Smoke (после build 37+ или dev)

1. В приложении: вход → Telegram (deep link flow) → открыть бота `t.me/<bot>?start=login_<uuid>`.
2. В боте: «✅ Подтверждено».
3. Возврат в app → сессия Supabase.

**OTP по chat_id** (поле в профиле) **не** использует этот webhook — только `verify-otp` на web.

---

## 6. Откат webhook

```bash
curl -sS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook"
```

Затем поставьте прежний URL (Hermes / chat-server).