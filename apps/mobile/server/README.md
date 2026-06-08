# Чат врачей УЗД — backend API

Сервер для регистрации врачей, входа (JWT) и общей ленты кейсов с комментариями.

## Запуск локально

```bash
cd server
npm install
npm start
```

По умолчанию порт **3100**. Проверка: открой `http://localhost:3100/health`.

## Переменные окружения

- `PORT` — порт (по умолчанию 3100)
- `JWT_SECRET` — секрет для подписи токенов (в production обязательно смените)
- `ADMIN_EMAIL` — email администратора (при старте сервера этому пользователю будет выдана роль `admin`, если он уже есть в базе)
- `ADMIN_USER_ID` — альтернатива email: id пользователя из `store.json` (например `u_171...`)

## Подключение приложения

В корне проекта `us-risk-calc` создай файл `.env` (или экспортируй переменную перед `expo start`):

```bash
EXPO_PUBLIC_CHAT_API_URL=http://localhost:3100
```

На **телефоне** вместо `localhost` укажи IP компьютера в Wi‑Fi, например:

```bash
EXPO_PUBLIC_CHAT_API_URL=http://192.168.1.10:3100
```

Данные хранятся в `server/data/store.json`, загрузки — в `server/uploads/`.

## Production

Вынесите API на HTTPS (Railway, Fly.io, VPS), задайте **`JWT_SECRET`** в окружении. При **`NODE_ENV=production`** сервер **не стартует** без `JWT_SECRET` (нет дефолтного секрета). Для локальной разработки без `NODE_ENV=production` допускается встроенный dev-секрет. Дальше: rate limiting (уже есть базово), аудит, резервное копирование и полноценная модель пользователей (email-подтверждение, сброс пароля).

## Модерация и безопасность (новое)

- Все endpoint `cases` работают только с JWT.
- Админ может:
  - смотреть список пользователей: `GET /admin/users`
  - блокировать: `PATCH /admin/users/:id/block`
  - разблокировать: `PATCH /admin/users/:id/unblock`
  - удалять кейсы: `DELETE /admin/cases/:id`
  - удалять комментарии: `DELETE /admin/cases/:caseId/comments/:commentId`
- Блокированный пользователь не может войти и писать в чат.
