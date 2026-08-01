# Email registration — mail-first UX (2026-08-01)

## Правило продукта

1. Регистрация: email + пароль + ФИО (+ специализация на полной форме).
2. Дата рождения **опциональна** на первом шаге (можно в профиле).
3. Production: пользователь **обязан** подтвердить email по ссылке из письма.
4. Auto-confirm только при `AUTH_AUTO_CONFIRM_EMAIL=true` или локальном `DEV_AUTH_MODE` (не production).

## Поток

```
Регистрация → письмо Supabase → /auth/callback → /app → вход при необходимости
```

Landing (`LandingAuthCard`): состояние **pending** + «Отправить письмо снова» + переход ко входу.

## Env (Vercel production)

```
AUTH_AUTO_CONFIRM_EMAIL=false
AUTH_ALLOW_PHONE=false   # mail-first
# SMTP в Supabase Auth настроен (Mail.ru)
```

`sync-vercel-env.mjs` больше не выставляет auto-confirm=true по умолчанию.

## Redirect

Login/register принимают `next` или `redirectedFrom` → default `/app`.
