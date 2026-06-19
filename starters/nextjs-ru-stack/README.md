# Next.js RU Stack Starter

Изолированный шаблон для РФ: **Next.js 14**, **NextAuth v5**, **Prisma**, **sms.ru**, **ЮKassa**, **Telegram**, **PostgreSQL**.

> **SonoGyn Pro** (`apps/web`) уже на **Supabase Auth + SMS.ru**.  
> Этот стартер — для **нового проекта** или осознанной миграции на NextAuth + Prisma.

## Стек

| Модуль | Технология |
|--------|------------|
| Framework | Next.js 14 App Router, TypeScript, Tailwind |
| Auth | NextAuth.js v5 (`@auth/core` + `@auth/prisma-adapter`) |
| DB | PostgreSQL (Supabase / Docker / VPS) |
| SMS | sms.ru HTTP API |
| Payments | ЮKassa |
| Notify | Telegram Bot API |

## Auth: Google OAuth + SMS

- **Google** — первый вход создаёт `User` через Prisma Adapter.
- **JWT-сессия** в httpOnly cookie (`session.strategy: "jwt"`).
- После Google-входа без `phoneVerified` → редирект на **`/verify-phone`**.
- Кастомный **`/login`** (Tailwind).
- Из РФ Google Cloud может быть недоступен — fallback: email/пароль или SMS.

### Переменные NextAuth

| Переменная | Описание |
|------------|----------|
| `GOOGLE_CLIENT_ID` | Google Cloud → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Client Secret |
| `NEXTAUTH_SECRET` или `AUTH_SECRET` | `openssl rand -hex 32` |
| `NEXTAUTH_URL` или `AUTH_URL` | `http://localhost:3000` / production URL |

Redirect URI в Google Console:  
`https://YOUR_DOMAIN/api/auth/callback/google`

## SMS через sms.ru

### Как получить api_id

1. Регистрация на [sms.ru](https://sms.ru).
2. **Настройки → API** → скопировать **api_id**.
3. Пополнить баланс (иначе код `201` / `210`).
4. Опционально: согласовать **подпись отправителя** (`SMSRU_FROM`).

### Переменные окружения SMS

| Переменная | Обязательно | Описание |
|------------|-------------|----------|
| `SMS_PROVIDER` | да | `smsru` (по умолчанию) |
| `SMSRU_API_ID` | да | api_id из личного кабинета |
| `SMSRU_FROM` | нет | Имя отправителя |
| `SMS_OTP_TTL_SEC` | нет | TTL кода, по умолчанию **300** (5 мин) |
| `SMS_OTP_LENGTH` | нет | Длина кода, по умолчанию **6** |
| `SMS_OTP_PEPPER` | prod | Соль для хеша OTP в БД |

### API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/auth/sms/send` | POST | `{ "phone": "+79990000000" }` → OTP |
| `/api/auth/sms/verify` | POST | `{ "phone", "code" }` → привязка телефона |

**Лимиты:** 1 SMS / мин / номер, max **5 SMS / час / номер**.

**Формат номера:** нормализация в **`7XXXXXXXXXX`** (11 цифр).

**Ошибки sms.ru** → понятные сообщения на русском (баланс, блокировка, неверный api_id).

### Модель Prisma `SMSVerification`

```prisma
model SMSVerification {
  id         String   @id @default(cuid())
  userId     String?
  phone      String   // 7XXXXXXXXXX
  codeHash   String   // SHA-256, не храним код открытым текстом
  expiresAt  DateTime // +5 мин
  attempts   Int      @default(0)
  verifiedAt DateTime?
  createdAt  DateTime @default(now())
}
```

## Структура

```
starters/nextjs-ru-stack/
├── prisma/schema.prisma
├── src/auth.ts               # NextAuth + Prisma adapter + Google/SMS
├── src/auth.config.ts        # Edge middleware callbacks
├── src/middleware.ts         # /verify-phone guard
├── src/lib/sms/              # sms.ru, OTP, rate limits, RU errors
├── src/app/login/page.tsx
├── src/app/verify-phone/page.tsx
├── src/app/api/auth/sms/send/route.ts
├── src/app/api/auth/sms/verify/route.ts
└── .env.example
```

## Локальный запуск

```bash
cd starters/nextjs-ru-stack
cp .env.example .env.local
# DATABASE_URL, AUTH_SECRET, SMSRU_API_ID

docker compose up -d
npm install
npx prisma migrate dev --name init
npm run dev                    # http://localhost:3000
```

## Деплой

```bash
npx vercel env add DATABASE_URL production
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add NEXTAUTH_URL production
npx vercel env add SMSRU_API_ID production
npx vercel deploy --prod
```

Webhook ЮKassa: `https://YOUR_DOMAIN/api/yookassa/webhook`

## Команды

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production build |
| `npx prisma migrate dev` | Миграции (dev) |
| `npx prisma migrate deploy` | Миграции (prod) |
