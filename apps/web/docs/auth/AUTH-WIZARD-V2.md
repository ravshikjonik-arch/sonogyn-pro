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

- `man-hero.png` / `woman-hero.png` — шапка login/register
- `man-picker.png` / `woman-picker.png` — карточки выбора
- `duo-banner.png` — общий баннер до выбора
- Пути: `lib/auth/character-assets.ts`

## Профиль

`/profile` → блок «Персонаж на экране входа».
