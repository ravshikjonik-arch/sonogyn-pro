# Auth wizard v2

- **Вход / регистрация:** только выбор **Мужчина** / **Женщина** (текст, без фото).
- **Фото врача:** `/profile` → блок «Ваше фото» (Supabase `clinical-avatars`).
- Флаг: `NEXT_PUBLIC_AUTH_WIZARD_V2` (default true). Классика: `?wizard=0`.
- Данные: `clinical_preferences.onboardingCharacter` = `boy` | `girl`.
