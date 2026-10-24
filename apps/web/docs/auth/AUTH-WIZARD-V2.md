# Auth wizard v2

- **Вход:** выбор **Мужчина** / **Женщина**, затем **Почта** (по умолчанию) или **Telegram**.
- **Регистрация:** wizard по почте; Telegram — ссылка на классическую форму.
- **Фото врача:** `/profile` → блок «Ваше фото» (Supabase `clinical-avatars`).
- Флаг: `NEXT_PUBLIC_AUTH_WIZARD_V2` (default true). Классика: `?wizard=0`.
- Данные: `clinical_preferences.onboardingCharacter` = `boy` | `girl`.
