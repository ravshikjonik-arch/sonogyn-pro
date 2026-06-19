# Next.js RU Stack Starter

Изолированный шаблон для РФ: **Next.js 14**, **NextAuth v5**, **Prisma**, **sms.ru**, **ЮKassa**, **Telegram**, **PostgreSQL**.

> **SonoGyn Pro** (`apps/web`) уже на **Supabase Auth + SMS.ru + Stripe**.  
> Для SonoGyn **не переписывайте** auth на NextAuth — логичнее **добавить ЮKassa в `apps/web`**.  
> Этот стартер — для **нового проекта** или осознанной миграции.

## Стек

| Модуль | Технология |
|--------|------------|
| Framework | Next.js 14 App Router, TypeScript, Tailwind |
| Auth | NextAuth.js v5 (Google + SMS + email/password) |
| DB | PostgreSQL (Supabase / Docker / VPS) |
| SMS | sms.ru (fallback: smsc.ru) |
| Payments | ЮKassa |
| Notify | Telegram Bot API |
| Deploy | Vercel CLI + Docker (VPS без VPN) |

## Структура

```
starters/nextjs-ru-stack/
├── prisma/schema.prisma      # User, Payment, SMSVerification, Notification
├── src/auth.ts               # NextAuth + Prisma adapter
├── src/auth.config.ts        # Providers (Edge-safe)
├── src/lib/sms/              # sms.ru, smsc.ru, OTP
├── src/lib/yookassa/         # create payment, webhook verify
├── src/lib/telegram/         # admin notifications
├── src/app/api/              # REST endpoints
├── docker-compose.yml        # локальный Postgres
├── Dockerfile                # VPS deploy
└── vercel.json               # region fra1, API timeout 30s
```

## Локальный запуск

```bash
cd starters/nextjs-ru-stack
cp .env.example .env.local
# заполните DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_APP_URL

docker compose up -d
npm install
npx prisma migrate dev --name init
npm run dev                    # http://localhost:3000
npx prisma studio              # GUI БД
```

## Деплой на Vercel (из РФ — часто нужен VPN)

```bash
cd starters/nextjs-ru-stack
npx vercel login               # один раз
npx vercel link                # новый проект или существующий
npx vercel env add DATABASE_URL production
npx vercel env add AUTH_SECRET production
npx vercel env add NEXT_PUBLIC_APP_URL production
# … остальные переменные из .env.example

npx vercel deploy --prod --yes
```

**Если CLI зависает на upload** → push в GitHub → Redeploy в [Vercel Dashboard](https://vercel.com).

### Supabase как Postgres (рекомендуется из РФ)

1. Supabase → Project → Settings → Database → URI (Transaction pooler для serverless).
2. `DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
3. NextAuth redirect: `https://YOUR_DOMAIN/api/auth/callback/google`

## VPS + Docker (без Vercel)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Google OAuth из РФ

Если Google Cloud недоступен — используйте **Email+пароль** или **SMS** (вкладки на `/login`).

## API

| Endpoint | Метод | Описание |
|----------|-------|----------|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth |
| `/api/auth/register` | POST | Email регистрация |
| `/api/sms/send` | POST | OTP SMS |
| `/api/yookassa/create` | POST | Создать платёж |
| `/api/yookassa/webhook` | POST | Webhook ЮKassa |

## Команды

| Команда | Назначение |
|---------|------------|
| `npm run dev` | Dev-сервер |
| `npm run build` | Production build |
| `npx prisma migrate dev` | Миграции (dev) |
| `npx prisma migrate deploy` | Миграции (prod) |
| `npx prisma studio` | Просмотр БД |
