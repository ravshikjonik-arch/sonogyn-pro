# Web Push — что сделать владельцу (≈5 мин)

Всё остальное уже на prod: **Doctor Chat v2**, флаги Vercel, публичный VAPID, миграции, Edge `notify-new-chat-message` v2.

Остался **один** шаг: секреты Edge (private VAPID), без них браузерные push не отправляются (in-app чат работает).

## 1. Токен Supabase

1. [Account → Access Tokens](https://supabase.com/dashboard/account/tokens) → **Generate new token**.
2. В `apps/web/.env.local`:

```env
SUPABASE_ACCESS_TOKEN=sbp_...
```

(Не коммитить. Не путать с `SUPABASE_SERVICE_ROLE_KEY`.)

## 2. Команда

```bash
cd apps/web
node scripts/finish-web-push-rollout.mjs
```

Скрипт:

- зальёт `WEB_PUSH_VAPID_*` в проект `grnwcbyslttbrqznnunq`;
- проверит `/api/health` на prod (если сеть доступна).

Ключи берутся из `.vapid-setup.local.json` (создаётся автоматически при первом `setup:web-push-vapid`, gitignored).

## 3. Проверка у себя

```bash
curl -s https://sonogyn-pro.ru/api/health | jq .rollout
# doctorChatV2: true, doctorChatWebPush: true

BASE_URL=https://sonogyn-pro.ru npm run test:messenger-v2-smoke
```

В браузере: hard refresh → `/cases?tab=chat` → войти → включить push (если UI предлагает). После ротации VAPID старые подписки нужно обновить.

## Альтернатива без токена

[Project → Edge Functions → Secrets](https://supabase.com/dashboard/project/grnwcbyslttbrqznnunq/settings/functions):

| Secret | Значение |
|--------|----------|
| `WEB_PUSH_VAPID_PUBLIC_KEY` | из `.vapid-setup.local.json` → `publicKey` |
| `WEB_PUSH_VAPID_PRIVATE_KEY` | из `.vapid-setup.local.json` → `privateKey` |
| `WEB_PUSH_VAPID_SUBJECT` | `mailto:support@sonogyn-pro.ru` |

## Rollback push

Vercel: `DOCTOR_CHAT_WEB_PUSH_ENABLED=false`, `NEXT_PUBLIC_DOCTOR_CHAT_WEB_PUSH_ENABLED=false` → redeploy. Чат v2 остаётся.
