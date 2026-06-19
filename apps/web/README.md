# SonoGyn Pro — Web (`apps/web`)

Next.js (App Router) + TypeScript + Tailwind CSS + Supabase Auth. Клиническая платформа УЗИ в акушерстве и гинекологии: рабочая область исследований, калькуляторы (O‑RADS, BI‑RADS, TI‑RADS, IOTA), онлайн‑школа (LMS), платежи (ЮKassa/Stripe), Telegram‑уведомления.

- **Production**: https://sonogyn-pro.ru
- **Монорепо**: pnpm workspaces, приложение в `apps/web`.
- **Версия пакета**: синхронизирована с релизом монорепо.

---

## 1. Быстрый старт (локально)

```bash
# из корня монорепо
pnpm install

# создать apps/web/.env.local (см. раздел «Переменные окружения»)
cp apps/web/.env.example apps/web/.env.local

# запуск dev-сервера
cd apps/web
npm run dev        # http://localhost:3000
```

Минимально необходимое для локального запуска:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Полезные команды:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # next build (webpack)
npm run start        # прод-сервер локально
```

---

## 2. Переменные окружения

Полный шаблон — в `apps/web/.env.example`. Ниже — что и зачем.

### Обязательные (production)

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL проекта Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Публичный anon‑ключ |
| `SUPABASE_SERVICE_ROLE_KEY` | Server‑only: admin‑флоу, webhooks, seed |
| `NEXT_PUBLIC_APP_URL` | Базовый URL (`https://sonogyn-pro.ru`) |
| `SONOGYN_AUTH_INTERNAL_SECRET` | Секрет server‑to‑server (≥32 симв.) |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (или `KV_REST_API_*`) |

> Гард `assertProductionSecretsConfigured()` (в `middleware.ts`) падает на старте, если в production слабый `SONOGYN_AUTH_INTERNAL_SECRET`, нет Upstash/KV, нет `SUPABASE_SERVICE_ROLE_KEY` или включён `DEV_*`.

### Платежи

| Переменная | Назначение |
|---|---|
| `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` | ЮKassa (РФ). Webhook: `/api/yookassa/webhook` или `/api/payment/webhook` |
| `YOOKASSA_PRO_PRICE_RUB` | Цена PRO по умолчанию |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe (международный). Webhook: `/api/stripe/webhook` |
| `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY` | Price ID подписки |

### SMS / Telegram

| Переменная | Назначение |
|---|---|
| `SMS_PROVIDER=smsru`, `SMSRU_API_ID` | OTP по SMS (вход/привязка телефона) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_IDS` | Уведомления и ежедневная сводка |

### Мониторинг и cron

| Переменная | Назначение |
|---|---|
| `CRON_SECRET` | Защита `/api/cron/daily-summary` (Vercel Cron шлёт `Authorization: Bearer <CRON_SECRET>`) |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Опционально (Sentry или self‑hosted GlitchTip) |

### CORS

| Переменная | Назначение |
|---|---|
| `CORS_BASE_DOMAIN` | Базовый домен (default `sonogyn-pro.ru`); разрешаются и поддомены `*.<домен>` |
| `CORS_ALLOWED_ORIGINS` | Доп. origin через запятую |

### Видео‑уроки (LMS), AI, Prisma — см. `apps/web/.env.example`.

---

## 3. База данных

### Supabase (основная схема)

Миграции — в `apps/web/supabase/migrations/`. Применение:

```bash
# bundle для ручного запуска в Supabase SQL Editor
npm run db:bundle
# или напрямую (нужен SUPABASE_DB_URL)
npm run db:migrate
```

Ключевые миграции LMS/платежей:
`20260619130000_payments.sql`, `20260620120000_course_author_lms.sql`,
`20260621120000_lesson_video_storage.sql`, `20260622120000_lms_school_upgrade.sql`.

### Prisma (опционально, coexistence)

Prisma добавлена **рядом** с Supabase (таблицы `prisma_*`, чтобы не затронуть `auth.*`, `profiles`, `payments`):

```bash
cd apps/web
npm run prisma:generate    # клиент
npm run prisma:init-sql     # сгенерировать prisma/init.sql (применить через SQL Editor)
npm run prisma:seed         # создать админа (нужен ADMIN_EMAIL, DATABASE_URL)
npm run prisma:studio       # http://localhost:5555
```

> ⚠️ Не запускайте `prisma migrate dev` против боевой Supabase‑БД — возможен reset. Применяйте `prisma/init.sql` вручную.

---

## 4. Безопасность и middleware

`apps/web/middleware.ts` обеспечивает:

- **Защиту маршрутов**: `/app`, `/dashboard`, `/profile`, `/patients`, `/workspace`, `/library`, `/author`, `/admin`, … → требуют сессию Supabase.
- **Роли**: `/admin/*` — только `admin`; `/author/*` — `author`/`admin`.
- **Phone gate**: авторизованные без подтверждённого телефона → `/verify-phone`.
- **Rate‑limit SMS на edge**: `POST /api/auth/sms/send` и `/api/auth/phone/send-otp` — 3 запроса/мин на IP.
- **Security headers**: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Strict-Transport-Security` (prod).
- **CORS** для `/api/*`: домен + поддомены, обработка preflight `OPTIONS`.
- **Bot‑detection**: блок scraper’ов на `/api/*` (с allowlist для webhook’ов, cron и health).

Health‑check: **`GET /api/health`** → `{ status, env, commit, checks }` (200/503).

---

## 5. Деплой на Vercel

### Настройки проекта
- **Root Directory**: `apps/web`
- **Framework**: Next.js
- Install/Build — заданы в `apps/web/vercel.json`.

### `vercel.json`
- **Cron**: `/api/cron/daily-summary` ежедневно в 06:00 UTC.
- **Redirect**: `www.sonogyn-pro.ru` → `https://sonogyn-pro.ru` (301).
- **maxDuration 60 c** для платёжных/webhook‑роутов задан в самих route‑файлах (`export const maxDuration = 60`) — App Router способ. На Vercel требует план Pro.

### Чек‑лист перед `vercel --prod`
1. В Vercel Dashboard → Settings → Environment Variables занесены все переменные из раздела 2 (Production scope).
2. Домены `sonogyn-pro.ru` и `www.sonogyn-pro.ru` добавлены в проект.
3. Supabase → Authentication → URL Configuration: Site URL и Redirect URLs включают `https://sonogyn-pro.ru/auth/callback`.
4. Вебхуки настроены: ЮKassa → `/api/yookassa/webhook`, Stripe → `/api/stripe/webhook`.
5. `npm run typecheck` и `npm run build` проходят локально.

### Команды деплоя

```bash
# первичная привязка проекта (один раз)
vercel link

# заливка переменных из .env.local (опционально)
# vercel env add <NAME> production

# превью-деплой
vercel

# продакшн-деплой
vercel --prod
```

Smoke‑проверка после деплоя:

```bash
curl -s https://sonogyn-pro.ru/api/health | jq
curl -I https://www.sonogyn-pro.ru        # должен вернуть 301 на apex-домен
```

---

## 6. Структура

- `app/` — страницы и роуты App Router; `app/(clinical)/` — защищённые разделы.
- `app/api/` — Route Handlers (auth, payments, courses, lessons, cron, health).
- `components/`, `lib/`, `services/` — UI, бизнес‑логика, сервисы (Telegram, logger).
- `utils/supabase/` — клиенты Supabase (browser/server/middleware).
- `prisma/` — схема Prisma (coexistence), seed, init.sql.
- `supabase/migrations/` — SQL‑миграции основной БД.
