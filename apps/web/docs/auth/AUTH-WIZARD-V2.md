# Auth wizard v2

Пошаговый login/register в стиле mobile-first: иллюстрация сверху, форма снизу, выбор персонажа (мальчик / девочка).

## Включение

- `NEXT_PUBLIC_AUTH_WIZARD_V2=true` (по умолчанию)
- Отключить: `NEXT_PUBLIC_AUTH_WIZARD_V2=false`
- Классический вход: `/login?wizard=0`, `/register?wizard=0`

## Данные

- `profiles.clinical_preferences.onboardingCharacter`: `"boy" | "girl"`
- `localStorage` ключ `sonogyn:onboarding-character:v1` — для иллюстрации до входа

## Ассеты

- `public/auth/characters/boy.svg`
- `public/auth/characters/girl.svg`

Замените на свои PNG/WebP, сохранив имена или обновите пути в `AuthCharacterHero.tsx`.

## Профиль

`/profile` → блок «Персонаж на экране входа».
