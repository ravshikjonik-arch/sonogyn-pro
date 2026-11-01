# Auth wizard v2

- **Вход:** выбор **Мужчина** / **Женщина**, затем **Почта** (по умолчанию) или **Telegram**.
- **Регистрация (почта):** email + пароль + телефон → код на почту (SMTP Mail.ru) → SMS на +7 → персонаж.
- **Регистрация (Telegram):** OAuth Login Widget + ФИО/ДР; телефон потом по SMS (не код в боте).
- **Open access:** кабинет без входа (`/home`), `/register` и `/login` остаются доступны.
- Env: `AUTH_ALLOW_PHONE=true` (SMS.ru), `AUTH_AUTO_CONFIRM_EMAIL=false` в prod.
- Флаг: `NEXT_PUBLIC_AUTH_WIZARD_V2` (default true). Классика: `?wizard=0`.
- После входа: `/profile/dashboard`.
