# Auth wizard v2

- **Вход:** выбор **Мужчина** / **Женщина**, затем **Почта** (по умолчанию) или **Telegram**.
- **Регистрация:** те же вкладки **Почта | Telegram** (Telegram — OAuth через бота + дата рождения).
- **Open access:** кабинет без входа (`/home`), но `/login` и `/register` **не редиректятся** — можно войти в свой аккаунт.
- **Фото врача:** `/profile` → блок «Ваше фото» (Supabase `clinical-avatars`).
- Флаг: `NEXT_PUBLIC_AUTH_WIZARD_V2` (default true). Классика (SMS, Яндекс): `?wizard=0`.
- Данные: `clinical_preferences.onboardingCharacter` = `boy` | `girl`.
- После входа: `/profile/dashboard` (не голый `/home`).
