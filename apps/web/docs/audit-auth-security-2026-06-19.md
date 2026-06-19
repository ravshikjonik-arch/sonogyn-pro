## Аудит входов/выходов и маршрутов (web) — 2026‑06‑19

Scope: `apps/web` (Next.js App Router + Supabase Auth + Tailwind).

### TL;DR (что закрыто сейчас)

- **/verify-phone**: доступ только для авторизованных пользователей с `phoneVerified = false` (Google/email/Telegram); успешная верификация → **/dashboard**.
- **SMS send**: добавлен **edge rate-limit 3 запроса/мин на IP** для `/api/auth/sms/send` и `/api/auth/phone/send-otp`.
- **Security headers**: добавлены базовые заголовки для всех страниц/API/redirect (без CSP, чтобы не ломать внешние виджеты и видео).

---

## 1) Полная карта маршрутов (страницы)

Источник истины: `apps/web/app/**/page.tsx` (URL = путь относительно `app/`, route groups в скобках `(...)` **не участвуют** в URL).

### Публичные страницы (не требуют Supabase session)

- `/` → `apps/web/app/page.tsx`
- `/landing` → `apps/web/app/landing/page.tsx`
- `/pricing` → `apps/web/app/pricing/page.tsx`
- `/login` → `apps/web/app/login/page.tsx`
- `/register` → `apps/web/app/register/page.tsx`
- `/auth/turnstile` → `apps/web/app/auth/turnstile/page.tsx`
- `/auth/telegram-bridge` → `apps/web/app/auth/telegram-bridge/page.tsx`

### Страница верификации телефона (условно-публичная)

- `/verify-phone` → `apps/web/app/verify-phone/page.tsx`
  - **Требует** auth session
  - **Доступна только если** `needsPhoneVerification(user) === true`

### Клинические страницы (защищены middleware)

Группа `apps/web/app/(clinical)/**` соответствует URL без сегмента `(clinical)`. Полный список файлов:

- `apps/web/app/(clinical)/admin/page.tsx`
- `apps/web/app/(clinical)/admin/nosologies/page.tsx`
- `apps/web/app/(clinical)/app/page.tsx`
- `apps/web/app/(clinical)/app/courses/page.tsx`
- `apps/web/app/(clinical)/assistant/page.tsx`
- `apps/web/app/(clinical)/assistant/fmf/page.tsx`
- `apps/web/app/(clinical)/assistant/gynecology/page.tsx`
- `apps/web/app/(clinical)/assistant/obstetrics/page.tsx`
- `apps/web/app/(clinical)/assistant/[mode]/[code]/page.tsx`
- `apps/web/app/(clinical)/breast-3d/page.tsx`
- `apps/web/app/(clinical)/calculators/page.tsx`
- `apps/web/app/(clinical)/calculators/[slug]/page.tsx`
- `apps/web/app/(clinical)/calculators/bi-rads/page.tsx`
- `apps/web/app/(clinical)/calculators/colposcopy/page.tsx`
- `apps/web/app/(clinical)/calculators/cervical-length/page.tsx`
- `apps/web/app/(clinical)/calculators/elastography/page.tsx`
- `apps/web/app/(clinical)/calculators/endometrium/page.tsx`
- `apps/web/app/(clinical)/calculators/o-rads/page.tsx`
- `apps/web/app/(clinical)/calculators/ob/page.tsx`
- `apps/web/app/(clinical)/calculators/pop-q/page.tsx`
- `apps/web/app/(clinical)/calculators/ti-rads/page.tsx`
- `apps/web/app/(clinical)/cases/page.tsx`
- `apps/web/app/(clinical)/cases/new/page.tsx`
- `apps/web/app/(clinical)/cases/[caseId]/page.tsx`
- `apps/web/app/(clinical)/community/page.tsx`
- `apps/web/app/(clinical)/dashboard/page.tsx`
- `apps/web/app/(clinical)/demo/emr/page.tsx`
- `apps/web/app/(clinical)/demo/patient-card/page.tsx`
- `apps/web/app/(clinical)/demo/roles/page.tsx`
- `apps/web/app/(clinical)/elastography/page.tsx`
- `apps/web/app/(clinical)/evidence/page.tsx`
- `apps/web/app/(clinical)/guidelines/page.tsx`
- `apps/web/app/(clinical)/guidelines/[guidelineId]/page.tsx`
- `apps/web/app/(clinical)/idea-deep-endometriosis/page.tsx`
- `apps/web/app/(clinical)/library/page.tsx`
- `apps/web/app/(clinical)/library/basic-course/page.tsx`
- `apps/web/app/(clinical)/library/courses/page.tsx`
- `apps/web/app/(clinical)/library/courses/[courseId]/page.tsx`
- `apps/web/app/(clinical)/library/courses/[courseId]/lessons/[lessonId]/page.tsx`
- `apps/web/app/(clinical)/library/my-courses/page.tsx`
- `apps/web/app/(clinical)/library/obstetric-atlas/page.tsx`
- `apps/web/app/(clinical)/library/orads-echograms/page.tsx`
- `apps/web/app/(clinical)/library/orads-guide/page.tsx`
- `apps/web/app/(clinical)/library/ozerskaya-iota-orads/page.tsx`
- `apps/web/app/(clinical)/mockups/page.tsx`
- `apps/web/app/(clinical)/nosologies/page.tsx`
- `apps/web/app/(clinical)/nosologies/[id]/page.tsx`
- `apps/web/app/(clinical)/ovary-atlas/page.tsx`
- `apps/web/app/(clinical)/patients/page.tsx`
- `apps/web/app/(clinical)/patients/new/page.tsx`
- `apps/web/app/(clinical)/patients/[patientId]/page.tsx`
- `apps/web/app/(clinical)/patients/[patientId]/pregnancy/page.tsx`
- `apps/web/app/(clinical)/paywall/page.tsx`
- `apps/web/app/(clinical)/profile/page.tsx`
- `apps/web/app/(clinical)/reference/page.tsx`
- `apps/web/app/(clinical)/reference/norms/page.tsx`
- `apps/web/app/(clinical)/uterus-3d/page.tsx`
- `apps/web/app/(clinical)/voice-reader/page.tsx`
- `apps/web/app/(clinical)/workspace/page.tsx`
- `apps/web/app/(clinical)/workspace/[studyId]/page.tsx`

### Авторский кабинет (защищён middleware + role gate)

- `apps/web/app/(clinical)/author/page.tsx`
- `apps/web/app/(clinical)/author/layout.tsx`
- `apps/web/app/(clinical)/author/profile/page.tsx`
- `apps/web/app/(clinical)/author/courses/page.tsx`
- `apps/web/app/(clinical)/author/courses/[courseId]/page.tsx`
- `apps/web/app/(clinical)/author/courses/[courseId]/students/page.tsx`

---

## 2) Полная карта API (Route Handlers)

Источник истины: `apps/web/app/**/route.ts` (URL = путь относительно `app/`, без `route.ts`).

### Auth / вход / выход

- `apps/web/app/api/auth/sign-in/route.ts` → `POST /api/auth/sign-in`
- `apps/web/app/api/auth/sign-up/route.ts` → `POST /api/auth/sign-up`
- `apps/web/app/api/auth/sign-out/route.ts` → `POST /api/auth/sign-out`
- `apps/web/app/api/auth/session/route.ts` → `GET /api/auth/session`
- `apps/web/app/api/auth/status/route.ts` → `GET /api/auth/status`
- `apps/web/app/api/auth/send-code/route.ts` → `POST /api/auth/send-code` (email/sms/telegram verification code)
- `apps/web/app/api/auth/verify-code/route.ts` → `POST /api/auth/verify-code`
- `apps/web/app/api/auth/resend-confirmation/route.ts` → `POST /api/auth/resend-confirmation`
- `apps/web/app/api/auth/revoke-all-sessions/route.ts` → `POST /api/auth/revoke-all-sessions`
- `apps/web/app/api/auth/mfa/verify-login/route.ts` → `POST /api/auth/mfa/verify-login`
- `apps/web/app/api/auth/mobile/exchange/route.ts` → `POST /api/auth/mobile/exchange`
- `apps/web/app/api/auth/phone/send-otp/route.ts` → `POST /api/auth/phone/send-otp`
- `apps/web/app/api/auth/phone/verify-otp/route.ts` → `POST /api/auth/phone/verify-otp`
- `apps/web/app/api/auth/sms/send/route.ts` → `POST /api/auth/sms/send` (alias → phone/send-otp)
- `apps/web/app/api/auth/sms/verify/route.ts` → `POST /api/auth/sms/verify` (alias → phone/verify-otp)
- `apps/web/app/api/auth/telegram/route.ts` → `POST /api/auth/telegram`
- `apps/web/app/api/auth/telegram/bot/route.ts` → `POST /api/auth/telegram/bot`
- `apps/web/app/auth/callback/route.ts` → `GET /auth/callback` (OAuth callback)
- `apps/web/app/auth/telegram/start/route.ts` → `GET /auth/telegram/start`
- `apps/web/app/auth/telegram/callback/route.ts` → `GET /auth/telegram/callback`
- `apps/web/app/api/auth/dev-login/route.ts` → `POST /api/auth/dev-login` (dev only, blocked in prod by middleware)

### Payments / billing

- `apps/web/app/api/payment/create/route.ts` → `POST /api/payment/create`
- `apps/web/app/api/payment/webhook/route.ts` → `POST /api/payment/webhook`
- `apps/web/app/api/yookassa/create/route.ts` → `POST /api/yookassa/create` (deprecated alias)
- `apps/web/app/api/yookassa/webhook/route.ts` → `POST /api/yookassa/webhook` (deprecated alias)
- `apps/web/app/api/stripe/create-checkout/route.ts` → `POST /api/stripe/create-checkout`
- `apps/web/app/api/stripe/restore/route.ts` → `POST /api/stripe/restore`
- `apps/web/app/api/stripe/webhook/route.ts` → `POST /api/stripe/webhook`

### Admin

- `apps/web/app/api/admin/users/[userId]/revoke-sessions/route.ts` → `POST /api/admin/users/:userId/revoke-sessions`

### Patients / studies / protocols (клинические данные)

- `apps/web/app/api/patients/route.ts`
- `apps/web/app/api/patients/[patientId]/route.ts`
- `apps/web/app/api/patients/[patientId]/studies/route.ts`
- `apps/web/app/api/studies/[studyId]/protocol/route.ts`

### LMS / Courses / Lessons

- `apps/web/app/api/courses/route.ts`
- `apps/web/app/api/courses/[courseId]/route.ts`
- `apps/web/app/api/courses/[courseId]/lessons/route.ts`
- `apps/web/app/api/courses/[courseId]/enroll/route.ts`
- `apps/web/app/api/user/enrollments/route.ts`
- `apps/web/app/api/user/progress/[courseId]/route.ts`
- `apps/web/app/api/lessons/[lessonId]/playback/route.ts`
- `apps/web/app/api/lessons/[lessonId]/attendees/route.ts`
- `apps/web/app/api/lessons/[lessonId]/register/route.ts`
- `apps/web/app/api/lessons/[lessonId]/complete/route.ts`
- `apps/web/app/api/lessons/[lessonId]/hls/[[...path]]/route.ts`
- `apps/web/app/api/webhooks/video/hls-complete/route.ts`

### Author API (role: author/admin)

- `apps/web/app/api/author/dashboard/route.ts`
- `apps/web/app/api/author/profile/route.ts`
- `apps/web/app/api/author/courses/route.ts`
- `apps/web/app/api/author/courses/[courseId]/route.ts`
- `apps/web/app/api/author/courses/[courseId]/cover/route.ts`
- `apps/web/app/api/author/courses/[courseId]/notify/route.ts`
- `apps/web/app/api/author/courses/[courseId]/students/route.ts`
- `apps/web/app/api/author/courses/[courseId]/students/export/route.ts`
- `apps/web/app/api/author/courses/[courseId]/modules/route.ts`
- `apps/web/app/api/author/courses/[courseId]/modules/[moduleId]/route.ts`
- `apps/web/app/api/author/courses/[courseId]/lessons/route.ts`
- `apps/web/app/api/author/courses/[courseId]/lessons/[lessonId]/route.ts`
- `apps/web/app/api/author/courses/[courseId]/lessons/[lessonId]/video/route.ts`
- `apps/web/app/api/author/courses/[courseId]/lessons/[lessonId]/video/upload/init/route.ts`
- `apps/web/app/api/author/courses/[courseId]/lessons/[lessonId]/video/upload/sign-part/route.ts`
- `apps/web/app/api/author/courses/[courseId]/lessons/[lessonId]/video/upload/complete/route.ts`

### AI / evidence / pubmed / copilot / career

- `apps/web/app/api/career/progress/route.ts`
- `apps/web/app/api/evidence/ask/route.ts`
- `apps/web/app/api/pubmed/abstracts/route.ts`
- `apps/web/app/api/ai/analyze/route.ts`
- `apps/web/app/api/ai/analyze/[jobId]/route.ts`
- `apps/web/app/api/ai/structured-report/route.ts`
- `apps/web/app/api/ai/nosology-assist/route.ts`
- `apps/web/app/api/ai/orads/route.ts`
- `apps/web/app/api/ai/ovary-assist/route.ts`
- `apps/web/app/api/copilot/studies/route.ts`
- `apps/web/app/api/copilot/studies/[studyId]/series/route.ts`
- `apps/web/app/api/copilot/studies/[studyId]/cds-preview/route.ts`
- `apps/web/app/api/copilot/images/register/route.ts`

### E2E/debug (dev only, blocked in production by middleware)

- `apps/web/app/api/debug/supabase/route.ts`
- `apps/web/app/api/e2e/appointments/route.ts`
- `apps/web/app/api/e2e/patients/[patientId]/record/route.ts`
- `apps/web/app/api/e2e/prescriptions/route.ts`
- `apps/web/app/api/e2e/schedule/route.ts`

---

## 3) middleware.ts — публичные и защищённые пути

Файл: `apps/web/middleware.ts`

### Защищённые root-префиксы (требуют auth session)

`/app`, `/dashboard`, `/profile`, `/library`, `/cases`, `/community`, `/workspace`, `/admin`, `/author`, `/patients`, `/reference`, `/guidelines`, `/evidence`, `/assistant`, `/voice-reader`, `/uterus-3d`, `/breast-3d`, `/ovary-atlas`, `/paywall`, `/calculators`, `/demo`, …

### Исключения внутри защищённых

- `/calculators/elastography` — разрешён без Supabase-логина (см. `PUBLIC_WITHIN_PROTECTED`)

### Проверки ролей

- `/admin/*` — только `profiles.role >= admin` (см. `getClinicalRole` + `roleMeetsMinimum`)
- `/author/*` — только `author` или `admin`

### Phone verification gate

- Любой защищённый маршрут + `needsPhoneVerification(user) === true` → redirect на `/verify-phone?redirectedFrom=...`
- `/verify-phone`:
  - без session → `/login?redirectedFrom=/verify-phone`
  - если телефон уже подтверждён → redirect на `redirectedFrom` или `/dashboard`

---

## 4) Проверка API (auth, validation, errors, CORS, rate limit)

### Auth (вход/выход)

- **Email/password**: `POST /api/auth/sign-in`, `POST /api/auth/sign-up`
  - **Auth**: создаёт/читает server session через Supabase cookies
  - **Rate limit**: есть (см. `consumeAuthRateLimit` + `RL.*`)
  - **CAPTCHA escalation**: есть (fail counters + Turnstile)
  - **Валидация**: ручная (строки/обязательные поля) — ок, но не через Zod

- **SMS**:
  - `POST /api/auth/phone/send-otp` + `POST /api/auth/phone/verify-otp`
  - `POST /api/auth/sms/send|verify` — алиасы
  - **Rate limit**:
    - в Route Handler: `RL.authPhoneSend` / `RL.authPhoneVerify`
    - **добавлено** в Edge: 3/мин на IP (middleware) для отправки кода
  - **Ошибки**: возвращаются безопасные сообщения (без user enumeration)

- **Logout / revoke**:
  - `POST /api/auth/sign-out` (server cookies cleared)
  - `POST /api/auth/revoke-all-sessions` (глобальный revoke)
  - `POST /api/admin/users/:id/revoke-sessions` (admin gate + rate limit)

### Клинические данные (patients/studies)

- **Auth**: через `supabase.auth.getUser()` + фильтр `created_by = user.id` (IDOR закрыто)
- **Валидация**: через Zod schemas из `@repo/types` для body (создание/патч)
- **Rate limit**: есть presets (IP + per-user + burst)

### Платежи

- `POST /api/payment/create`: **auth required**, Zod body, per-user rate limit
- `POST /api/payment/webhook`: **public**, guard по IP YooKassa + повторная загрузка платежа из API
- Stripe webhook: **public**, проверка signature (`stripe.webhooks.constructEvent`)

### CORS

- CORS заголовки **не выставляются** явно (нормально для same-origin web app).
- Для webhook'ов CORS не нужен (server-to-server).
- Если планируется внешняя браузерная интеграция с другого домена — нужно добавить явный CORS только на нужные endpoints (узкий allowlist).

---

## 5) Что изменено в рамках аудита

### Edge rate limiting для SMS send (3/мин на IP)

- добавлен файл: `apps/web/lib/security/edge-sms-rate-limit.ts`
- включено в `apps/web/middleware.ts` для:
  - `POST /api/auth/sms/send`
  - `POST /api/auth/phone/send-otp`

### Security headers (ручная настройка)

В `apps/web/middleware.ts` добавлено для всех ответов/redirect:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (только production)

---

## 6) Что осталось (рекомендации)

- **CSP**: добавить (но аккуратно) — потребуется инвентаризация внешних доменов (Stripe, Vimeo/YouTube, Supabase, analytics).
- **Zod на все auth bodies**: сейчас часть auth эндпоинтов валидирует руками — можно унифицировать на Zod.
- **Единый формат ошибок**: местами `400` используется как “db error”; лучше различать `400/401/403/404/429/500`.
- **Покрыть edge rate-limit для verify попыток** (не только send) — если будет нужно усиление от brute-force (сейчас уже есть server-side RL).

