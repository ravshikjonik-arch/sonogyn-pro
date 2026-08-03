# Mail-first: Vercel + Supabase (2026-08-03)

## Правильные значения

| Где | Параметр | Значение |
|-----|----------|----------|
| Vercel Production | `NEXT_PUBLIC_APP_URL` | `https://sonogyn-pro.ru` |
| Vercel Production | `AUTH_AUTO_CONFIRM_EMAIL` | `false` |
| Vercel Production | `AUTH_ALLOW_PHONE` | `false` (mail-first) |
| Supabase | Site URL | `https://sonogyn-pro.ru` |
| Supabase | Redirect URLs | `https://sonogyn-pro.ru/**`, `http://localhost:3000/**` |
| Supabase | Confirm email | **ON** |

## Команды

```bash
# 1) Vercel APP URL
cd apps/web
printf '%s' 'https://sonogyn-pro.ru' | vercel env add NEXT_PUBLIC_APP_URL production --force
printf '%s' 'false' | vercel env add AUTH_AUTO_CONFIRM_EMAIL production --force

# 2) Supabase Site URL (нужен SUPABASE_ACCESS_TOKEN в .env.local)
node scripts/configure-supabase-auth-urls.mjs --apply
```

## Ручной путь (если нет Access Token)

1. [URL Configuration](https://supabase.com/dashboard/project/ocqlsqqloqvlzutbgrnp/auth/url-configuration)  
   Site URL = `https://sonogyn-pro.ru`  
   Redirect URLs добавить production + localhost.
2. [Email provider](https://supabase.com/dashboard/project/ocqlsqqloqvlzutbgrnp/auth/providers)  
   Confirm email = ON.
3. Vercel → Project → Settings → Environment Variables → `NEXT_PUBLIC_APP_URL`.

## Проверка

```bash
curl -s https://sonogyn-pro.ru/api/auth/status | jq .features
# emailAutoConfirm: false, authEmailOnly: true, smtpConfigured: true

BASE_URL=https://sonogyn-pro.ru node apps/web/scripts/test-email-signup-flow.mjs
```
