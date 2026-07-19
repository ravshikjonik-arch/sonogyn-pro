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
supabase functions deploy notify-new-chat-message --project-ref <PROJECT_REF>
```

URL после деплоя:

- `https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-comment`
- `https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-case-question`
- `https://<PROJECT_REF>.supabase.co/functions/v1/notify-new-chat-message`

---

## 2. Секреты (Vault + опционально Edge env)

**Prod:** секреты в **Supabase Vault** (не в git). SQL Editor (service role), один раз:

```sql
select vault.create_secret('<PROJECT_REF>', 'supabase_project_ref', 'Supabase project ref for edge URLs');
select vault.create_secret('<openssl rand -hex 32>', 'discussions_webhook_secret', 'Webhook header for push edge functions');
```

Опционально дублировать на Edge Functions (если есть CLI-доступ):

```bash
supabase secrets set DISCUSSIONS_WEBHOOK_SECRET="<same hex>" --project-ref <PROJECT_REF>
```

Edge Functions проверяют `DISCUSSIONS_WEBHOOK_SECRET` из env **или** RPC `verify_discussion_webhook_secret` (Vault).

**Проверка:** без заголовка `x-webhook-secret` функции отвечают `401 Unauthorized`.

---

## 3. Database Webhooks — pg_net + SQL-триггеры (prod)

На prod используются **SQL-триггеры** (`pg_net`), не Dashboard Webhooks.

Миграции:

- `20260624161753_doctor_discussions_push_webhooks.sql` — триггеры + `net.http_post`
- `20260624162105_doctor_discussions_webhook_secret_verify.sql` — RPC для Edge Functions

| Триггер | Таблица | Событие | Edge Function |
|---------|---------|---------|---------------|
| `notify_new_comment_webhook` | `teaching_case_comments` | INSERT | `notify-new-comment` |
| `notify_new_case_question_webhook` | `cases` | INSERT (skip if `channel_id` null) | `notify-new-case-question` |
| `notify_new_chat_message_webhook` | `doctor_chat_messages` | INSERT | `notify-new-chat-message` |

**Логика `notify-new-comment`:** подписчики `case_subscriptions` → `user_push_tokens` → Expo.

**Логика `notify-new-case-question`:** подписчики `channel_subscriptions` → Expo (только вопросы коллегам).

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

- Физическое устройство (не симulator без push).
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
| `401` в логах webhook | `x-webhook-secret` совпадает с Vault / `DISCUSSIONS_WEBHOOK_SECRET` |
| `skipped: true` | Webhook B: INSERT без `channel_id`; или неверная таблица |
| `no_subscribers` | Нет строк в `case_subscriptions` / `channel_subscriptions` |
| `tokens: 0` | Mobile не зарегистрировал `user_push_tokens` |
| Push не приходит на iOS | APNs credentials в EAS, physical device, permissions |
