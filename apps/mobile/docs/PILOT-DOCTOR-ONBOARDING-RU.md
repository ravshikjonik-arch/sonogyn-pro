# Пилот 50–100 врачей · iOS / Android

## UX (простой путь)

1. Установка из TestFlight / APK / Store.
2. Splash → согласие (152-ФЗ, AI, условия).
3. **Регистрация** (email, пароль, ФИО, дата рождения, специализация).
4. Кабинет (калькуляторы, O-RADS, FMF и т.д.).

Повторный запуск: Splash → **вход** (если сессия истекла).

## Env (EAS production / preview)

| Переменная | Значение |
|------------|----------|
| `EXPO_PUBLIC_API_BASE_URL` | `https://sonogyn-pro.ru` |
| `EXPO_PUBLIC_SUPABASE_URL` | ваш Supabase project |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `EXPO_PUBLIC_MOBILE_REQUIRE_REGISTRATION` | `true` |
| `EXPO_PUBLIC_MOBILE_SIMPLE_EMAIL_AUTH` | `true` |

## Сборка

```bash
cd apps/mobile
npx eas-cli build --platform android --profile preview
npx eas-cli build --platform ios --profile preview
```

## Backend

- Mobile дергает `POST /api/auth/sign-up` и `sign-in` на web API (`x-sonogyn-client: mobile`).
- **UX «сразу в кабинет»:** в Supabase Auth можно отключить «Confirm email» для пилота **или** на Vercel задать `AUTH_AUTO_CONFIRM_EMAIL=true` + `SUPABASE_SERVICE_ROLE_KEY` (осознанно, только для пилота 50–100).
- Иначе врач после регистрации получит письмо — это нормально, но шаг лишний для «простого» сценария.

## Web vs mobile

- **Web** (`OPEN_ACCESS_FULL`) может оставаться открытым для маркетинга.
- **Store app** — обязательная регистрация через `EXPO_PUBLIC_MOBILE_REQUIRE_REGISTRATION`.
