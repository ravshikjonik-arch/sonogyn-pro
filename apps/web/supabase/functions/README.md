# Doctor discussions — Edge Functions (push)

Push-уведомления для коллегиальных обсуждений: новый вопрос в разделе и новый ответ в треде.

**Стек:** Supabase Database Webhooks → Edge Functions → `user_push_tokens` → [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/).

---

## 1. Деплой Edge Functions

Из каталога `apps/web` (или корня monorepo с `--project-ref`):

```bash
supabase login
supabase link --project-ref <PROJECT_REF>

supabase functions deploy notify-new-comment --project-ref <PROJECT_REF>
supabase functions deploy notify-new-case-question --project-ref <PROJECT_REF>
```

URL после деплоя:

- `https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-comment`
- `https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-case-question`

---

## 2. Секреты

Сгенерируйте общий секрет для верификации webhook-запросов:

```bash
supabase secrets set DISCUSSIONS_WEBHOOK_SECRET="$(openssl rand -hex 32)" --project-ref <PROJECT_REF>
```

Edge Functions автоматически получают `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` от Supabase.
Дополнительно нужен только `DISCUSSIONS_WEBHOOK_SECRET`.

**Проверка:** без заголовка `x-webhook-secret` в production функции отвечают `401 Unauthorized`.

---

## 3. Database Webhooks (оба)

**Supabase Dashboard → Database → Webhooks → Enable Webhooks → Create a new hook**

### Webhook A — новый ответ в обсуждении кейса

| Поле | Значение |
|------|----------|
| **Name** | `notify-new-comment` |
| **Table** | `public.teaching_case_comments` |
| **Events** | `INSERT` (только Insert) |
| **Type** | HTTP Request |
| **Method** | POST |
| **URL** | `https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-comment` |
| **HTTP Headers** | `Content-Type: application/json` |
| **HTTP Headers** | `x-webhook-secret: <DISCUSSIONS_WEBHOOK_SECRET>` |
| **Filter** | *(пусто)* |

**Логика функции:**

1. Берёт `case_id`, `author_id`, `body` из INSERT.
2. Находит подписчиков в `case_subscriptions` (кроме автора комментария).
3. Достаёт `expo_push_token` из `user_push_tokens`.
4. Шлёт batch в Expo Push API.

---

### Webhook B — новый вопрос коллегам в разделе

| Поле | Значение |
|------|----------|
| **Name** | `notify-new-case-question` |
| **Table** | `public.cases` |
| **Events** | `INSERT` |
| **Type** | HTTP Request |
| **Method** | POST |
| **URL** | `https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-case-question` |
| **HTTP Headers** | `Content-Type: application/json` |
| **HTTP Headers** | `x-webhook-secret: <DISCUSSIONS_WEBHOOK_SECRET>` |
| **Filter** | `channel_id` **is not null** |

**Логика функции:**

1. Если `channel_id` пустой — skip (учебная библиотека, не push).
2. Находит подписчиков в `channel_subscriptions` для этого `channel_id` (кроме автора кейса).
3. Push через Expo.

> **Важно:** фильтр на webhook обязателен — иначе push уйдёт и при создании обычных учебных кейсов (`channel_id IS NULL`).

---

## 4. Миграция БД (если ещё не применена)

```bash
pnpm --filter @repo/web db:migrate
```

Или SQL Editor → `20260624120000_doctor_discussions_extend.sql`.

Нужные таблицы: `channel_subscriptions`, `case_subscriptions`, `user_push_tokens`, колонки `cases.channel_id`, `teaching_case_comments.is_best_answer`.

---

## 5. Mobile — регистрация push-токена

После входа в Supabase mobile-клиент вызывает `registerPushTokenWithSupabase()`:

- Файл: `apps/mobile/src/lib/push/registerPushToken.ts`
- Хук: `apps/mobile/src/hooks/usePushTokenRegistration.ts` (подключён в `AppStack`)

Требования:

- Физическое устройство (не симулятор без push).
- Разрешение на уведомления.
- `expo.extra.eas.projectId` в `app.json` (уже есть).
- EAS build / dev client для production push.

На **web** регистрация пропускается.

---

## 6. Проверка end-to-end

1. Применить миграцию + задеплоить функции + создать оба webhook.
2. Войти в mobile → в логах `[push] token registered` (dev) или проверить строку в `user_push_tokens`.
3. На web `/cases` → «Вопросы коллегам» → выбрать раздел → «Push · …» (подписка `channel_subscriptions`).
4. Создать кейс с `channel_id` или ответить в треде.
5. Edge Function logs (Dashboard → Edge Functions → Logs): `{ "sent": 1, "tokens": 1 }`.

Если `sent: 0` — проверьте подписчиков и наличие токенов.

---

## 7. Отличие от других уведомлений в проекте

| Механизм | Транспорт | Триггер |
|----------|-----------|---------|
| **Doctor discussions (этот README)** | Expo Push | Database Webhook → Edge Function |
| Курсы (`notifyCourseStudents`) | Email / SMS / Telegram | Ручной API автора |
| Telegram admins | Telegram Bot | Код приложения (signup и т.д.) |
| Realtime UI | In-app only | `postgres_changes` |

Это **первая** push-цепочка в репозитории.

---

## 8. Troubleshooting

| Симптом | Что проверить |
|---------|----------------|
| `401` в логах webhook | `x-webhook-secret` совпадает с `DISCUSSIONS_WEBHOOK_SECRET` |
| `skipped: true` | Webhook B: INSERT без `channel_id`; или неверная таблица |
| `no_subscribers` | Нет строк в `case_subscriptions` / `channel_subscriptions` |
| `tokens: 0` | Mobile не зарегистрировал `user_push_tokens` |
| Push не приходит на iOS | APNs credentials в EAS, physical device, permissions |
