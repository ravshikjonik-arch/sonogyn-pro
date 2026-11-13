# SonoGyn Pro — плейбук исправлений в Cursor

Один файл: контекст, правила для агента, 10 задач с готовыми промптами, скрипт проверки, чек-лист приёмки.

**Как пользоваться — два способа:**

**Способ А (проще).** Положите этот файл в репозиторий как `docs/CURSOR-PLAYBOOK.md`. Дальше в Cursor пишете одну строку и указываете номер задачи — агент сам прочитает нужный раздел:

```
@docs/CURSOR-PLAYBOOK.md Прочитай разделы «Правила» и «Задача 01» и выполни задачу 01.
```

**Способ Б (полный контроль).** Скопируйте блок «Правила» в `.cursor/rules/sonogyn-pro.mdc`, блок «Скрипт» в `scripts/audit-smoke.mjs`, а промпты вставляйте в чат Cursor по одному, по мере готовности.

В обоих случаях: одна задача = одна ветка = один PR, между задачами прогон `node scripts/audit-smoke.mjs`.

---

## 0. Что чиним (короткий контекст)

Аудит от 12.11.2026 показал:

- **88 из 95** URL отдают пустую оболочку на 1574 байта вместо страницы (заголовок ответа `x-sonogyn-cd-proxy: bootstrap`);
- вся платформа зависит от `*.vercel.app`: при блокировке — `ERR_FAILED` с чужим адресом в браузере;
- 21 страница без уникального title, 61 без canonical, 88 без H1, 90 — меньше 50 слов;
- `og:image` → 404, ссылки в мессенджерах без превью;
- PRO нельзя купить: на проде «оплата временно недоступна»;
- CTA «Начать»/«Войти» ведут на `/landing#join` (якорь), `/app` → `/home` (сплэш без входа);
- оператор не идентифицирован, в футере ник `Yakrav7700`, на регистрации нет согласия на ПДн;
- H1 «Тарифы» имеет контраст **1,05:1**, 3 поля калькулятора без label, иконки без имени;
- LCP 2,79 с, 956 КБ, 566 КБ JS, ассеты с чужого origin;
- аналитики нет вообще (ни Метрики, ни GA4).

Цель плейбука — закрыть это маленькими проверяемыми шагами за 2–3 недели.

---

## 1. Карта задач

| № | Задача | Ветка | Оценка |
|---|---|---|---|
| 00 | Разведка репозитория (ничего не меняет) | — | 20 мин |
| 01 | Домен отдаёт SSR, ассеты с домена | `fix/p0-domain-ssr` | 1–2 дня |
| 02 | Метаданные, canonical, sitemap, OG | `fix/p0-seo-metadata` | 1 день |
| 03 | Воронка: CTA, `/home`, регистрация | `fix/p0-funnel` | 1–2 дня |
| 04 | Оплата: включить или честно скрыть | `feat/payments` | 1–3 дня |
| 05 | Юридика и доверие | `fix/legal-trust` | 1–2 дня |
| 06 | Доступность | `fix/a11y` | 1–2 дня |
| 07 | Производительность и PWA | `perf/landing` | 1–2 дня |
| 08 | Аналитика и события | `feat/analytics` | 0,5 дня |
| 09 | Контентный SEO-слой | `feat/seo-content` | постоянно |

Порядок важен: 01 → 02, остальное можно параллелить. Задача 04 зависит от 05 (оферта нужна до приёма платежей).

---

## 2. Правила для агента

Скопируйте в файл `.cursor/rules/sonogyn-pro.mdc`. Cursor подхватит его автоматически для всех файлов репозитория.


````
---
description: Правила проекта SonoGyn Pro для Cursor Agent
globs: ["**/*"]
alwaysApply: true
---

# SonoGyn Pro — правила для агента

## Что это за проект

Клиническая CDS-платформа для врачей УЗИ и акушерства-гинекологии.
Стек: Next.js (App Router) + TypeScript + Tailwind + Supabase (Auth/DB/Storage) + Vercel, PWA.
Аудитория — только медицинские специалисты. Пациенты не являются пользователями.

## Жёсткие инварианты (нарушать нельзя)

1. **Никаких персональных данных пациентов** в коде, тестах, сидах, демо-данных, логах. Только обезличенные кейсы.
2. **Ключ `service_role` никогда не попадает в клиентский бандл.** В браузере — только `anon` + RLS.
3. **Не отключать RLS** и не писать политики «разрешить всё». Любая миграция RLS — отдельный PR с описанием.
4. **Не ослаблять безопасность:** не убирать CSP/HSTS/X-Frame-Options, не добавлять `unsafe-eval`, не расширять `script-src` без явного разрешения.
5. **Секреты только через env.** Никаких ключей в коде, в `NEXT_PUBLIC_*` — только публичные значения.
6. **Медицинские формулировки:** расчёт — «справочная информация (CDS)», не диагноз. Дисклеймер сохраняется на всех страницах с калькуляторами.
7. **Тон текста:** профессионально, по делу, без маркетингового шума («вселенная», «магия», «революция» — нет). Обращение — к врачу, на «вы».

## Обязательно для каждой новой/изменённой страницы

- `metadata` (title ≤ 60 симв., description ≤ 155 симв., без дубля бренда в title).
- `canonical` через `metadataBase` — абсолютный URL на `https://sonogyn-pro.ru`.
- Ровно один `<h1>`, далее без пропуска уровней.
- Для приватных разделов (`/app`, `/login`, `/profile`, `/home`) — `robots: { index: false }`.
- Все `<img>` с осмысленным `alt`; все `<input>` — с `<label>` или `aria-label`; иконочные кнопки — с `aria-label`.
- Контраст текста ≥ 4.5:1 (обычный) и ≥ 3:1 (крупный). Не использовать белый текст на `#7c6df5` мельче 18px.

## Качество

Перед тем как сказать «готово», выполнить и показать вывод:

```bash
pnpm typecheck        # или npx tsc --noEmit
pnpm lint
pnpm build
node scripts/audit-smoke.mjs --base http://localhost:3000
```

Если какой-то команды нет в проекте — скажи об этом, не выдумывай.

## Границы задачи

- Делай **только** то, что просят. Не рефакторить попутно, не менять форматирование чужих файлов, не обновлять зависимости без запроса.
- Если задача требует решения, которое ты не можешь проверить (DNS, панель Vercel, договор с ЮKassa) — **остановись и спроси**, не имитируй.
- Если находишь блокер вне своей зоны (например, прокси живёт в Cloudflare Worker, а не в репозитории) — опиши это в ответе и предложи, что сделать руками.
- Не коммить и не пушить без явной команды.

## Git

- Conventional Commits: `fix(seo): ...`, `feat(paywall): ...`, `chore(a11y): ...`.
- Один PR — одна задача из `docs/prompts/`.
- В описании PR: что изменено, как проверено, какие риски.

## Полезные команды

```bash
rg -n "sonogyn-cd-proxy|bootstrap|vercel\.app" --glob '!node_modules'   # найти прокси-оболочку
rg -n "assetPrefix|basePath" next.config.*                              # откуда абсолютные ассеты
node scripts/audit-smoke.mjs --base https://sonogyn-pro.ru              # проверка прода
```
````


---

## 3. Задачи

Ниже — готовые промпты. Каждый рассчитан на один PR. Вставляйте целиком, ничего не сокращая: блоки «Проверка» и «Не делай» — часть работы.


### Задача 00. Разведка репозитория (Ask, без изменений)

**Режим:** Ask


````
# Промпт 00. Разведка репозитория (без изменений)

Вставьте в Cursor **в режиме Ask**, ничего не меняя в коде.

---

Ты — старший инженер. Мне нужна карта проекта перед серией фиксов. **Ничего не меняй, только читай.**

Контекст: прод-домен `https://sonogyn-pro.ru` отдаёт для 88 из 95 URL пустую HTML-оболочку на 1574 байта:

```html
<title>SonoGyn Pro</title>
<body><p>Загрузка кабинета…</p></body>
<script>
  var upstream="https://sonogyn-pro-web-ravshan-s-projects3.vercel.app";
  // fetch(upstream + path) -> document.write(html)
  // setTimeout(8000) -> location.replace(upstream + path)
</script>
```

В ответе есть заголовок `x-sonogyn-cd-proxy: bootstrap`. Полноценный SSR отдаёт только апстрим на `*.vercel.app`.

Задача разведки:

1. Найди, где формируется эта оболочка и заголовок `x-sonogyn-cd-proxy`:
   ```
   rg -n "sonogyn-cd-proxy|bootstrap|vercel\.app|document\.write|upstream" --glob '!node_modules' --glob '!.next'
   ```
2. Определи, где живёт прокси: в этом репозитории (middleware/route handler), в отдельном сервисе или в Cloudflare Worker (`wrangler.toml`, `worker/`, `functions/`). Если в репозитории нет — так и скажи.
3. Покажи структуру: где `app/`, где `middleware.ts`, где `next.config.*`, какие есть env-переменные (только имена, без значений).
4. Проверь `next.config.*` на `assetPrefix`, `basePath`, `images.remotePatterns` — откуда в HTML абсолютные ссылки на `vercel.app`.
5. Найди, как сейчас задаются метаданные: есть ли общий `generateMetadata`, где `metadataBase`, есть ли `app/sitemap.ts`, `app/robots.ts`.
6. Найди компоненты: шапка лендинга (CTA «Начать»/«Войти»), страница `/home`, страница `/pricing`, форма регистрации, провайдер оплаты, баннер установки PWA.
7. Перечисли риски, которые видишь: что сломается, если убрать прокси; где могут быть завязки на `vercel.app` (CSP, cookies, OAuth redirect, Supabase redirect URL).

Формат ответа:
- «Карта» — дерево ключевых файлов с одной строкой описания.
- «Где прокси» — конкретный файл/сервис или «в репозитории отсутствует».
- «План фикса P0-1» — 5–8 шагов, каждый с файлом.
- «Вопросы ко мне» — максимум 5 пунктов, только то, без чего нельзя начать.

Не предлагай правок кода. Не пиши «готово». Только карта и план.
````



### Задача 01. Домен отдаёт SSR, а не оболочку (P0)

**Режим:** Agent


````
# Промпт 01. Домен должен отдавать SSR, а не оболочку (P0)

Ветка: `fix/p0-domain-ssr`

---

Контекст: `https://sonogyn-pro.ru/<любой-путь>` отдаёт 1 574 байта заглушки вместо страницы. Полный HTML есть только у 5 URL. Заголовок ответа — `x-sonogyn-cd-proxy: bootstrap`. Любая ошибка или медленный ответ апстрима превращается в `ERR_FAILED` с адресом `sonogyn-pro-web-ravshan-s-projects3.vercel.app` в строке браузера (проверено блокировкой этого хоста). Кроме того, весь JS/CSS грузится с `*.vercel.app`, а не с домена — это ломает RUM (`Timing-Allow-Origin` не отдаётся, `transferSize = 0`).

Задача: сделать так, чтобы `sonogyn-pro.ru` **сам** отдавал полноценный SSR, а ассеты — с того же origin.

Шаги:

1. Если прокси-оболочка есть в репозитории — удали её из критического пути. Если она в Cloudflare Worker/отдельном сервисе — **остановись**, опиши это и дай инструкцию, что поменять в панели (не имитируй фикс).
2. Убедись, что домен — обычный alias/rewrite на Next-деплой, без промежуточного HTML-фетча.
3. Проверь `next.config.*`: не должно быть `assetPrefix` на `vercel.app`. `basePath` — пустой. Все `_next/static/*` в HTML должны быть относительными (`/_next/...`).
4. Проверь CSP: если в `script-src`/`style-src`/`font-src`/`img-src` остались `https://*.vercel.app` только ради ассетов — убери после того, как ассеты поедут с домена. Не ослабляй остальное.
5. Проверь OAuth/redirect URL: Telegram, Яндекс ID, Supabase Auth должны иметь `https://sonogyn-pro.ru` в разрешённых redirect (не `vercel.app`).
6. Убери `setTimeout(8000) → location.replace(upstream)` из любого места, где он есть. Ни при каком сценарии пользователь не должен уезжать на чужой домен.
7. Добавь в `next.config` (или middleware) защиту: неизвестный путь → нормальная 404-страница с брендом, а не редирект на апстрим.

Критерии приёмки (проверить curl'ом, вывод приложить):

```bash
curl -s https://sonogyn-pro.ru/tools/o-rads | wc -c          # > 20000
curl -s https://sonogyn-pro.ru/tools/o-rads | grep -o '<title>[^<]*'
curl -s https://sonogyn-pro.ru/ | grep -o '<h1>[^<]*'          # лендинг, не логин-стена
curl -sI https://sonogyn-pro.ru/tools/o-rads | grep -i x-sonogyn
curl -s https://sonogyn-pro.ru/tools/o-rads | grep -o 'vercel\.app' | wc -l   # 0
```

Ожидаемо: размер 20–60 КБ, title страницы, H1, нет заголовка `x-sonogyn-cd-proxy`, ноль вхождений `vercel.app` в HTML.

Не делай: не меняй дизайн, не трогай Supabase, не переписывай метаданные (это следующий промпт), не деплой без моей команды.

В ответе: что изменил (файлы), что осталось сделать руками (панель/DNS), вывод curl-проверок.
````



### Задача 02. Метаданные, canonical, sitemap, OG (P0)

**Режим:** Agent


````
# Промпт 02. Метаданные, canonical, sitemap, OG (P0)

Ветка: `fix/p0-seo-metadata`

---

Контекст (замеры по 95 URL):

- 21 страница отдаёт дефолтный `<title>SonoGyn Pro</title>` — `/tools`, `/cases`, `/feed`, `/tools/refs`, все `/ai/consultants/*`;
- 61 страница без `<link rel="canonical">`;
- 88 страниц без `<h1>` в SSR;
- 30 описаний длиннее 160 символов (обрезаются в выдаче, часть — обрывом слова: «…медицинским диагнозо»);
- дубли бренда: «SonoGyn Pro | SonoGyn Pro», «O-RADS US · комната · SonoGyn Pro | SonoGyn Pro»;
- `og:image` = `https://sonogyn-pro.ru/clinical-atlas/orads-referat/case-01.png` → **404**;
- `/` редиректит на `/home` (логин-стена), лендинг живёт на `/landing`;
- `noindex` нет нигде; `/login`, `/app`, `/profile` открыты для индексации.

Задача — привести SEO-слой в порядок системно, а не по одной странице.

1. Введи `metadataBase: new URL('https://sonogyn-pro.ru')` и общий `generateMetadata`/хелпер `buildMetadata({title, description, path, noindex})`, который:
   - НЕ добавляет `| SonoGyn Pro` повторно, если бренд уже в title;
   - обрезает title до 60 и description до 155 симв. по границе слова;
   - всегда ставит абсолютный canonical из `path`;
   - ставит `robots: { index: false }` для приватных путей.
2. Пройди по всем маршрутам и задай уникальные title/description. Приоритет: калькуляторы и справочники (их должны находить по «O-RADS калькулятор», «IOTA ADNEX», «протокол УЗИ матки»).
3. Ровно один `<h1>` на страницу, видимый, с ключевой сутью (не «Ваша вселенная…»).
4. Сделай `/` = публичный лендинг (200), а `/landing` → 301 на `/`. Canonical лендинга — `https://sonogyn-pro.ru/`.
5. Сгенерируй OG-баннер 1200×630 (или подключи существующий ассет), положи в `public/`, проверь, что отдаётся 200 и указан в `openGraph.images` + `twitter:image`.
6. `app/sitemap.ts` — генерировать из реальных маршрутов, только `index: true` страницы и только 200-е URL. Убрать `/reports/adnex` (307) и `/home`.
7. `app/robots.ts` — `Allow: /`, `Disallow: /app, /login, /register, /profile, /api`, `Sitemap: https://sonogyn-pro.ru/sitemap.xml`.
8. JSON-LD: `Organization` (с реальным юрлицом — заглушку не выдумывай, оставь TODO), `WebApplication` на лендинге, `MedicalWebPage` + `BreadcrumbList` на страницах калькуляторов, `FAQPage` — только там, где FAQ реально виден в DOM (требование Google).
9. Хлебные крошки — визуальные и в разметке, на всех внутренних страницах.

Критерии приёмки:

```bash
node scripts/audit-smoke.mjs --base http://localhost:3000
# ожидаемо: 0 провалов по title/canonical/h1/og:image/description
curl -s http://localhost:3000/tools/o-rads | grep -o '<link rel="canonical"[^>]*>'
curl -sI http://localhost:3000/og-default.png | head -1   # 200
```

Не делай: не переписывай тексты лендинга целиком (это отдельная задача), не трогай аналитику, не меняй дизайн карточек.

В ответе: таблица «маршрут → title → canonical» для 10 самых важных страниц, список того, что осталось (например, реальные реквизиты юрлица для Organization).
````



### Задача 03. Воронка: CTA, /home, регистрация (P0)

**Режим:** Agent


````
# Промпт 03. Воронка: CTA, /home, регистрация (P0)

Ветка: `fix/p0-funnel`

---

Контекст (проверено кликами в браузере):

- в шапке лендинга «Начать» и «Войти» ведут на `/landing#join` — это якорь, а не регистрация и не вход;
- «Открыть кабинет без регистрации» ведёт на `/app`, а `/app` → 307 → `/home`;
- `/home` — полноэкранный сплэш с логотипом и одной кнопкой «Начать». Кнопки «Войти» нет, объяснения нет;
- на `/home` при недоступном апстриме блокируется главный поток — страница перестаёт отвечать;
- регистрация: имя, фамилия, email, телефон (+7), пароль, повтор, специализация, код на почту;
- нет триала PRO, нет годового плана, нет конкретных лимитов Free/PRO («расширенные лимиты» — не цифра).

Задача:

1. Шапка: «Начать» → `/register`, «Войти» → `/login`. Убери якорные ссылки как основные CTA.
2. `/app` оставь, но он должен вести в демо-кабинет (калькуляторы без входа), а не на сплэш. Если демо-кабинет требует сессии — открывай гостевой режим с ограничениями.
3. `/home`:
   - добавь «Войти» и «Продолжить без регистрации»;
   - сократи логотип/высоту, добавь один экран пользы (3 пункта) и строку доверия;
   - убедись, что при недоступном бэкенде страница показывает локальный экран с калькуляторами и повтор подключения, а не зависает.
4. Регистрация — двухшаговая:
   - шаг 1: email + пароль (3 поля максимум);
   - шаг 2 (после входа): имя, фамилия, специализация, телефон — опционально, с прогрессом профиля;
   - телефон не должен быть обязательным; маска +7 остаётся для тех, кто вводит.
5. Добавь чекбокс согласия на обработку ПДн со ссылкой на `/privacy` и на оферту — обязательный, не предзаполненный.
6. Paywall: покажи Free/PRO цифрами (сколько расчётов, кейсов, AI-запросов в месяц), добавь 7-дневный триал без карты и годовой план со скидкой (если платёжка это поддерживает; если нет — TODO и не выдумывай цены).
7. События воронки проставь заглушками-вызовами `track('...')` (реализация — в задаче про аналитику): `landing_view`, `cta_click`, `signup_start`, `signup_complete`, `first_calc`, `paywall_view`, `checkout_start`.

Критерии приёмки:

```bash
# все ссылки шапки ведут на страницы, а не в якоря
curl -s http://localhost:3000/ | grep -o 'href="/register"\|href="/login"'
# регистрация: не больше 3 обязательных полей на первом шаге
# ручной прогон: лендинг -> регистрация -> кабинет -> калькулятор -> paywall, без тупиков
node scripts/audit-smoke.mjs --base http://localhost:3000
```

Не делай: не меняй цены без подтверждения, не подключай платёжку в этой задаче, не переписывай весь лендинг.

В ответе: схема воронки «шаг → URL → что видит пользователь», список изменённых файлов, что требует решения владельца (цены, лимиты, длина триала).
````



### Задача 04. Оплата: включить или честно скрыть (P0)

**Режим:** Agent


````
# Промпт 04. Оплата: включить или честно скрыть (P0)

Ветка: `feat/payments`

---

Контекст: на проде `/pricing` пишет «Оплата PRO на этом стенде временно недоступна… дождитесь настройки ЮKassa», при этом лендинг обещает «990 ₽ / 30 дней», «Оплата картой РФ, чек на email», «Оформить PRO». Пользователь доходит до конца воронки и упирается в заглушку. CSP уже разрешает `js.stripe.com` и `challenges.cloudflare.com`, но фактический провайдер по текстам — ЮKassa.

Задача: убрать разрыв между обещанием и реальностью. Выбери один из двух режимов по фактическому состоянию env.

**Режим А — оплата включена** (есть `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`):

1. Серверный роут `POST /api/billing/checkout`: создаёт платёж, возвращает `confirmation_url`. Ключи — только на сервере, никогда в `NEXT_PUBLIC_*`.
2. Вебхук `POST /api/billing/webhook`: проверка IP/подписи, идемпотентность по `payment_id`, запись в таблицу `subscriptions` (миграция в отдельном файле), выдача PRO на 30 дней, продление при рекурренте.
3. Страница `/paywall`: тариф, срок, что входит, кнопка «Оплатить», обработка `success`/`fail`, чек на email.
4. Возвраты и отмена — описать в оферте (это задача 05), в коде — эндпоинт отмены подписки.
5. Не логировать платёжные данные, не хранить номер карты.

**Режим Б — оплаты ещё нет:**

1. Убери с лендинга и `/pricing` цену, слово «PRO» как продаваемое и кнопки «Оформить»/«Оплатить».
2. Вместо них — «PRO в разработке, оставьте почту» с формой waitlist и сохранением в Supabase (RLS: вставка анонимно, чтение только админом).
3. В `<meta robots>` для `/pricing` — `index: true`, но без цены в title/description.
4. Никаких «стендов» и «дождитесь настройки» в пользовательских текстах.

Общее:

- Определяй режим по env, а не хардкодом: `PAYMENTS_ENABLED=true|false`. Страница должна корректно работать в обоих режимах.
- Добавь в `scripts/audit-smoke.mjs` проверку: если `PAYMENTS_ENABLED=false`, на `/pricing` нет строки «990» и нет кнопки «Оплатить».

Критерии приёмки:

```bash
# Режим Б: обещаний оплаты нет
curl -s http://localhost:3000/pricing | grep -c "990 ₽"        # 0
curl -s http://localhost:3000/ | grep -c "Оформить PRO"        # 0
# Режим А: создаётся платёж (тестовый магазин), вебхук идемпотентен
```

Не делай: не подключай новый провайдер без моего выбора, не трогай Supabase Auth, не придумывай цены.

В ответе: выбранный режим и почему, схема платежа (создание → вебхук → выдача PRO → продление), что нужно от меня (ключи, тестовый магазин, юрлицо для чека).
````



### Задача 05. Юридика и доверие (P0)

**Режим:** Agent


````
# Промпт 05. Юридика и доверие (P0)

Ветка: `fix/legal-trust`

---

Контекст (фактические тексты на проде):

- оператор в политике и соглашении — «владелец домена sonogyn-pro.ru», без ИП/ООО, ИНН, ОГРН, адреса, телефона;
- контакты разные: `Sonogyn-pro@mail.ru` (документы) и `support@sonogyn-pro.ru` (тарифы);
- в футере: «SonoGyn Pro · Yakrav7700 · не является медицинским изделием без регистрации»;
- в документах: «Документ продукта, не замена консультации юриста» — внутренняя пометка на публичной странице;
- на странице регистрации собираются имя, фамилия, email, телефон, специализация, пароль — **без видимого чекбокса согласия на обработку ПДн и без ссылки на политику**;
- политика сама признаёт трансграничную передачу в ЕС (Supabase eu-west-1);
- нет оферты и условий возврата — обязательны для приёма платежей.

Задача: закрыть доверительный контур. **Юридические формулировки — черновик, финальную версию проверяет юрист.**

1. Футер: убрать ник, поставить `© 2026 <Юрлицо/ИП>, ИНН <...>` + ссылки «Политика», «Оферта», «Контакты», `support@sonogyn-pro.ru`. Данные юрлица возьми из env/конфига `legal.ts` — **не выдумывай**, оставь `TODO` и сообщи, что нужно.
2. Страница `/contacts`: юрлицо, ИНН/ОГРН, адрес, email, телефон, время ответа, лицо по вопросам ПДн.
3. Регистрация: обязательный чекбокс «Я ознакомлен(а) с Политикой и Офертой и даю согласие на обработку ПДн» + ссылки. Без галочки кнопка неактивна. Согласие фиксировать в БД (дата, версия документа).
4. `/privacy`: переписать под 152-ФЗ:
   - оператор с реквизитами;
   - перечень данных и целей, правовые основания;
   - сроки хранения;
   - передача в ЕС: основание/статус (это решение владельца — оставь TODO с двумя вариантами: локализация БД в РФ или оформление трансграничной передачи);
   - права субъекта, отзыв согласия, контакт ответственного;
   - никаких «может означать» — либо факт, либо план устранения.
5. `/offer` — публичная оферта: предмет, стоимость, порядок оплаты, срок, возврат, ответственность, порядок изменения. Соглашение для App Store оставить отдельным документом, не смешивать с веб-офертой.
6. Убрать из публичных документов пометки «не замена консультации юриста» и «документ продукта».
7. Проверить формулировки про медизделие: «не является медицинским изделием» должно быть точным и одинаковым на лендинге, в футере, в оферте. Если продукт подлежит регистрации — это вопрос к юристу, оставь TODO.
8. Убедиться, что дисклеймер CDS виден на каждой странице с калькулятором.

Критерии приёмки:

```bash
curl -s http://localhost:3000/ | grep -o "ИНН [0-9]*"            # реквизиты есть
curl -s http://localhost:3000/register | grep -c "согласие"      # чекбокс есть
curl -s http://localhost:3000/offer | grep -o "<h1>[^<]*"        # оферта отдаётся
curl -s http://localhost:3000/privacy | grep -c "Yakrav7700"     # 0
```

Не делай: не придумывай реквизиты и не публикуй «шаблонный» ИНН, не подменяй юриста, не удаляй существующие дисклеймеры.

В ответе: чек-лист закрытых пунктов, список данных, которые должен дать владелец, и список вопросов юристу.
````



### Задача 06. Доступность (P0)

**Режим:** Agent


````
# Промпт 06. Доступность (P0)

Ветка: `fix/a11y`

---

Контекст (axe-core 4.10.2, mobile 390×844, реальные замеры):

| Где | Нарушение | Факт |
|---|---|---|
| `/pricing` | `color-contrast` | **H1 «Тарифы» — 1,05:1** (нужно ≥ 4,5) — заголовок практически не виден |
| `/pricing` | `color-contrast` ×6 | кнопка `#7c6df5` + белый текст = **3,91:1** при 12 px |
| `/landing` | `color-contrast` ×4 | CTA `#3b82f6` + белый = **3,67:1** при 14 px |
| все | `button-name` | иконки меню и поиска без доступного имени |
| `/ai/consultants/fmf` | `label` ×3 | числовые поля калькулятора без label |
| `/landing`, `/pricing`, FMF | `heading-order` | пропущены уровни |
| все | `region` | контент вне landmark-регионов |

Задача: устранить нарушения системно через дизайн-токены, а не точечными `style`.

1. Введи/поправь токены контраста: основной текст, вторичный текст, текст на primary-фоне. Подбери цвета так, чтобы:
   - обычный текст ≥ 4,5:1;
   - крупный (≥ 18,66 px bold / 24 px) ≥ 3:1;
   - белый на primary — либо затемнить primary, либо использовать тёмный текст.
   Добавь в `globals.css` комментарий с рассчитанными коэффициентами.
2. Причина невидимого H1 на `/pricing` — наследование `oklch(0.129 …)` на тёмном фоне. Найди и почини (класс/переменная), не «закрашивай» `text-white` точечно.
3. Все иконочные кнопки — `aria-label` (RU) + видимый `focus-visible` ring.
4. Все поля калькуляторов — `<label htmlFor>` (видимый или `sr-only`) + `inputMode` + `aria-describedby` для единиц измерения (мм, г, недели).
5. Порядок заголовков: один `h1`, дальше без пропусков. Исправь на лендинге, в тарифах, в FMF.
6. Landmark-регионы: `<header>`, `<nav>`, `<main>`, `<footer>` в layout; скрытый «К основной работе» skip-link.
7. Горизонтальные скролл-области (широкие таблицы/код) — `tabindex="0"` + `role="region"` + `aria-label`.
8. Проверь клавиатурную навигацию в калькуляторе: tab-порядок, Enter = расчёт, фокус не теряется после результата.

Критерии приёмки:

```bash
npx @axe-core/cli http://localhost:3000/pricing --exit
npx @axe-core/cli http://localhost:3000/tools/calc/rads/o-rads --exit
npx @axe-core/cli http://localhost:3000/ai/consultants/fmf --exit
# ожидаемо: 0 critical/serious
```

Ручная проверка: пройти калькулятор O-RADS только клавиатурой, скринридером (VoiceOver) услышать название каждого поля.

Не делай: не меняй бренд-палитру целиком без согласования, не убирай анимации, не трогай логику расчётов.

В ответе: таблица «до/после» по контрасту с коэффициентами, список файлов, что осталось (например, ручная проверка скринридером).
````



### Задача 07. Производительность и PWA (P1)

**Режим:** Agent


````
# Промпт 07. Производительность и PWA (P1)

Ветка: `perf/landing`

---

Контекст (mobile 390×844, CDP):

- LCP **2,79 с** (норма < 2,5), FCP 0,54 с, TTFB 0,49 с, CLS 0;
- вес **956 КБ**, 40 запросов: JS 566 КБ, картинки 238 КБ, шрифты 84 КБ, CSS 34 КБ;
- все ассеты грузятся с `*.vercel.app` (другой origin), `Timing-Allow-Origin` не отдаётся → `transferSize = 0` → RUM и любой аудит занижают вес;
- HTML отдаётся с `Cache-Control: public, max-age=0, must-revalidate`;
- баннер «Установить SonoGyn Pro» перекрывает контент на мобильных почти на каждом экране;
- два манифеста (`manifest.webmanifest` и `manifest.json`) дублируют конфиг; иконка 512 объявлена как `any` и `maskable` без safe zone.

Задача:

1. Ассеты — с домена (см. задачу 01). Добавь `Timing-Allow-Origin: *` для статики.
2. LCP: определи элемент LCP (через PerformanceObserver на проде/локально), для hero-картинки — `priority`/`fetchPriority="high"`, `sizes`, AVIF/WebP, `width`/`height`; для шрифтов — `display: swap` + `preload` только критичных начертаний + сабсет latin/cyrillic.
3. Кэш: лендинг и справочники — `s-maxage=3600, stale-while-revalidate=86400`; статика `immutable` уже есть — не ломать.
4. Динамические импорты: 3D/визуализация, AI-чат, тяжёлые таблицы — `next/dynamic` с `ssr: false` и загрузкой по действию пользователя. Цель — JS первого экрана ≤ 250 КБ gzip.
5. Баннер установки: не показывать на первом визите, не перекрывать контент, запоминать отказ (`localStorage`), показывать не чаще 1 раза в 14 дней и только после 2+ визитов.
6. Манифест: оставить один `app/manifest.ts`; иконки 192/512 отдельно для `any` и `maskable` (safe zone 80 %); `start_url: '/'`, не `/home`.
7. `next/image` для всех контентных картинок, `sizes` корректен, без CLS.
8. Проверить, что скрытые модалки не рендерятся в DOM до открытия.

Критерии приёмки:

```bash
node scripts/audit-smoke.mjs --base http://localhost:3000   # вес и LCP в отчёте
# локально: Lighthouse mobile по / и /tools/calc/rads/o-rads
# ожидаемо: LCP < 2.5 s, JS первого экрана < 250 KB gzip, CLS < 0.1
```

Не делай: не убирай PWA-функциональность, не ломай офлайн-калькуляторы, не меняй дизайн hero без согласования.

В ответе: до/после по LCP, весу JS, числу запросов; что дало наибольший выигрыш; что осталось (например, шрифты требуют дизайнера).
````



### Задача 08. Аналитика и события (P1)

**Режим:** Agent


````
# Промпт 08. Аналитика и события (P1)

Ветка: `feat/analytics`

---

Контекст: в HTML и в 24 загруженных JS-чанках **не найдено** ни Яндекс.Метрики, ни GA4, ни GTM, ни Firebase — только строка Sentry-эндпоинта. CSP при этом разрешает `googletagmanager`, `google-analytics`, `mc.yandex.ru`, `*.ingest.sentry.io`. Итог: воронка не измеряется, ошибки не алертятся, решения принимаются «на глаз».

Задача:

1. Подключи **Яндекс.Метрику** (основная для РФ) и **GA4** (для сквозной аналитики) через `next/script` с `strategy="afterInteractive"`, ID — из env (`NEXT_PUBLIC_YM_ID`, `NEXT_PUBLIC_GA_ID`). Если ID нет — счётчик не грузится, ошибок в консоли нет.
2. Consent-баннер: до согласия — только необходимые cookies; Метрика/GA — после «Принять». Отказ запоминать, ссылка «Настройки cookie» в футере. Сохранять выбор в localStorage и в БД (для аудита согласий).
3. Единый слой `lib/analytics.ts`: `track(event, params)` с типобезопасным списком событий:
   - `landing_view`, `cta_click {cta, placement}`;
   - `signup_start`, `signup_complete {method}`;
   - `calculator_open {id}`, `calculator_calc {id}`;
   - `case_save`, `ai_request {mode}`;
   - `paywall_view {plan}`, `checkout_start {plan}`, `checkout_success`;
   - `install_prompt_shown`, `install_accepted`.
   События дублировать в `dataLayer` и `ym('reachGoal', ...)`.
4. Sentry: инициализация с `tracesSampleRate`, `release` из git sha, `beforeSend` — вырезать PHI (email, телефон, любые поля форм калькулятора). Алерт на рост 5xx и на ошибки гидрации.
5. Серверные метрики: логируй TTFB и время расчёта калькулятора (без ПДн), чтобы видеть деградации.
6. Дашборд (описание в `docs/analytics.md`): воронка визит → регистрация → первый расчёт → paywall → оплата; retention W1/W4; топ-10 калькуляторов; доля мобильных.

Критерии приёмки:

```bash
# без consent сетевых запросов к mc.yandex.ru / google-analytics нет
# после «Принять» — есть; события видны в отладчике Метрики
curl -s http://localhost:3000/ | grep -c "mc.yandex.ru"   # 0 до согласия
```

Не делай: не отправляй в аналитику содержимое полей калькуляторов, не ставь счётчики без consent, не добавляй тяжёлые SDK в первый экран.

В ответе: список событий с параметрами, схема consent, что нужно от меня (ID счётчиков, DSN Sentry, доступ к дашборду).
````



### Задача 09. Контентный SEO-слой (P1)

**Режим:** Agent


````
# Промпт 09. Контентный SEO-слой вокруг калькуляторов (P1, постоянный)

Ветка: `feat/seo-content`

---

Контекст: 90 из 95 страниц содержат меньше 50 слов в SSR. Врач, пришедший из поиска по «калькулятор O-RADS» или «толщина эндометрия норма», видит интерфейс без объяснения методики, источников и ограничений. На лендинге всего 17 внутренних ссылок, из клинических разделов — 3; остальные страницы — сироты.

Задача: сделать калькуляторы полноценными посадочными страницами и связать их в сетку.

1. Введи шаблон страницы калькулятора `CalculatorPageLayout`:
   - H1: «Калькулятор O-RADS US (ACR v2022)» — не «O-RADS US · комната»;
   - лид 2–3 предложения: что считает, для кого, чем помогает;
   - сам калькулятор (без изменений логики);
   - блок «Как считается»: критерии, пороги, что означает результат;
   - «Источники»: ACR/ISUOG/IOTA/FMF с годом и ссылкой;
   - «Ограничения»: когда не применять;
   - «Пример расчёта» с обезличенным кейсом;
   - FAQ 4–6 вопросов (и `FAQPage` schema);
   - «Связанные инструменты»: 3–5 ссылок на соседние калькуляторы и справочники;
   - «Обновлено: <дата>», «Проверил: <ФИО, специальность>» (из конфига авторов).
2. Заполни так 10 приоритетных страниц (в этом порядке):
   `/tools/calc/rads/o-rads`, `/tools/calc/rads/bi-rads`, `/tools/calc/rads/ti-rads`,
   `/tools/calc/rads/iota`, `/tools/calc/gyn/endometrium`, `/tools/calc/ob/fetal-weight`,
   `/tools/calc/ob/bishop`, `/tools/calc/ob/vbac`, `/tools/calc/gyn/pop-q`,
   `/tools/refs/norms`.
3. Хаб `/tools/calc`: сетка всех калькуляторов с фильтрами (акушерство/гинекология/RADS) и текстовым лидом — чтобы страница перестала быть «4 слова».
4. С лендинга добавь блок «Популярные калькуляторы» (6–8 ссылок) и ссылку на хаб.
5. Запусти `/blog` со структурой: статья-разбор гайдлайна, клинический кейс, «как считать X». Первые 3 темы: «O-RADS: как оценить придатки за 2 минуты», «IOTA ADNEX vs O-RADS: что выбрать», «Норма толщины эндометрия по фазам — таблица».
6. Требования к качеству: каждый медицинский текст проходит ревью врача (поле `reviewedBy` в frontmatter), источники обязательны, дата обновления видна, никаких выдуманных цифр — если нет источника, не публикуй.

Критерии приёмки:

```bash
# каждая из 10 страниц: слов в SSR > 400, один h1, canonical, JSON-LD
node scripts/audit-smoke.mjs --base http://localhost:3000
# на лендинге >= 8 внутренних ссылок на калькуляторы
```

Не делай: не меняй формулы расчётов, не генерируй медицинские факты «из головы», не публикуй тексты без врачебного ревью, не копируй чужие статьи.

В ответе: список готовых страниц, таблица «страница → источники → кто проверил», план следующих 10 страниц.
````




---

## 4. Скрипт проверки

Скопируйте в `scripts/audit-smoke.mjs`. Запуск:

```bash
node scripts/audit-smoke.mjs --base http://localhost:3000
node scripts/audit-smoke.mjs --base https://sonogyn-pro.ru --limit 10 --verbose
node scripts/audit-smoke.mjs --json > report.json
```

Код возврата `1`, если есть провалы — можно вешать в CI. Проверяет: HTTP 200, bootstrap-заглушку, title, description, canonical, ровно один H1, `og:image` (200), вхождения `*.vercel.app`, `noindex` на публичных страницах, редиректы из sitemap.


````
#!/usr/bin/env node
/**
 * audit-smoke.mjs — проверка SEO-гигиены и доступности страниц без зависимостей.
 *
 * Запуск:
 *   node scripts/audit-smoke.mjs                        # http://localhost:3000
 *   node scripts/audit-smoke.mjs --base https://sonogyn-pro.ru
 *   BASE_URL=http://localhost:3000 node scripts/audit-smoke.mjs
 *   node scripts/audit-smoke.mjs --limit 10 --verbose
 *   node scripts/audit-smoke.mjs --pages /,/pricing,/tools/o-rads
 *   node scripts/audit-smoke.mjs --json > report.json
 *
 * Код возврата 1, если есть провалы — можно вешать в CI.
 *
 * Что проверяется на каждой странице:
 *   - HTTP 200 (не редирект на чужой хост, не 404)
 *   - это не bootstrap-заглушка (размер > 5000 байт, нет «Загрузка кабинета…»)
 *   - есть <title>, он не дублирует бренд, длина <= 65
 *   - есть <meta description> длиной 90..160
 *   - есть абсолютный canonical, совпадающий с путём
 *   - ровно один <h1>
 *   - og:image отдаёт 200
 *   - в HTML нет *.vercel.app
 *   - в sitemap нет URL с редиректом (проверяется по факту ответа)
 *
 * Чего скрипт не делает: Core Web Vitals и a11y — для них Lighthouse / @axe-core/cli.
 */

const DEFAULTS = ['/', '/pricing', '/tools', '/tools/calc', '/tools/o-rads', '/privacy'];

const args = process.argv.slice(2);
const getArg = (name, fallback = null) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const hasFlag = (name) => args.includes(`--${name}`);

const BASE = (getArg('base') || process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const LIMIT = Number(getArg('limit', 0)) || 0;
const CONCURRENCY = Number(getArg('concurrency', 6)) || 6;
const JSON_OUT = hasFlag('json');
const VERBOSE = hasFlag('verbose');
const PAGES_ARG = getArg('pages');
const UA = 'SonoGyn-AuditSmoke/1.0 (+audit)';

const c = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', dim: '\x1b[2m', bold: '\x1b[1m',
};

async function fetchText(url, opts = {}) {
  const started = performance.now();
  const res = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    ...opts,
  });
  const body = await res.text();
  return { res, body, ms: Math.round(performance.now() - started), ttfb: 0, size: Buffer.byteLength(body) };
}

function first(re, html) {
  const m = html.match(re);
  return m ? m[1].trim() : '';
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, ' ');
}

function analyze(path, html, res) {
  const url = new URL(path, BASE).toString();
  const fails = [];
  const warns = [];
  const info = { path, url, status: res.status, size: Buffer.byteLength(html) };

  const isShell = info.size < 5000 || /Загрузка кабинета|Загрузка формы/.test(html.slice(0, 4000));
  if (res.status !== 200) fails.push(`HTTP ${res.status} (ожидался 200)${res.redirected ? ' после редиректа на ' + res.url : ''}`);
  if (isShell) fails.push(`bootstrap-заглушка: ${info.size} байт, контента нет`);

  const title = decode(first(/<title[^>]*>([\s\S]*?)<\/title>/i, html));
  info.title = title;
  if (!title) fails.push('нет <title>');
  else {
    if (title.length > 65) warns.push(`title ${title.length} симв. — обрежется`);
    if (/SonoGyn Pro\s*\|\s*SonoGyn Pro/i.test(title)) fails.push('дубль бренда в title');
  }

  const desc = decode(first(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, html))
    || decode(first(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, html));
  info.description = desc;
  if (!desc) fails.push('нет meta description');
  else if (desc.length < 90) warns.push(`description ${desc.length} симв. — коротко`);
  else if (desc.length > 160) warns.push(`description ${desc.length} симв. — обрежется`);

  const canonical = first(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i, html)
    || first(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i, html);
  info.canonical = canonical;
  if (!canonical) fails.push('нет canonical');
  else {
    try {
      const cPath = new URL(canonical, BASE).pathname.replace(/\/+$/, '') || '/';
      const pPath = new URL(url).pathname.replace(/\/+$/, '') || '/';
      if (cPath !== pPath) warns.push(`canonical указывает на ${cPath}, а страница ${pPath}`);
      if (!/^https?:\/\//.test(canonical)) warns.push('canonical относительный');
    } catch { warns.push('canonical не парсится'); }
  }

  const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
    .map((m) => decode(m[1].replace(/<[^>]+>/g, '')).trim())
    .filter(Boolean);
  info.h1 = h1s;
  if (h1s.length === 0) fails.push('нет <h1>');
  else if (h1s.length > 1) fails.push(`${h1s.length} тега <h1>`);

  const robots = first(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i, html);
  info.robots = robots;
  if (/noindex/i.test(robots)) fails.push(`noindex на публичной странице`);

  if (/vercel\.app/i.test(html)) fails.push('в HTML есть *.vercel.app (ассеты/ссылки не с домена)');

  const ogImage = first(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i, html);
  info.ogImage = ogImage;
  if (!ogImage) warns.push('нет og:image');
  return { info, fails, warns };
}

async function checkOgImage(ogImage) {
  if (!ogImage) return true;
  try {
    const r = await fetch(new URL(ogImage, BASE), { method: 'GET', signal: AbortSignal.timeout(15000), headers: { 'user-agent': UA } });
    return r.ok;
  } catch {
    return false;
  }
}

async function getPaths() {
  if (PAGES_ARG) return PAGES_ARG.split(',').map((p) => p.trim()).filter(Boolean);
  try {
    const { res, body } = await fetchText(`${BASE}/sitemap.xml`);
    if (res.ok) {
      const locs = [...body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)]
        .map((m) => m[1].trim())
        .filter((u) => {
          try { return new URL(u).host === new URL(BASE).host; } catch { return false; }
        })
        .map((u) => new URL(u).pathname || '/');
      if (locs.length) return [...new Set(locs)];
    }
  } catch { /* нет sitemap — идём по дефолту */ }
  return DEFAULTS;
}

async function pool(items, size, worker) {
  const out = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx]);
    }
  });
  await Promise.all(runners);
  return out;
}

const paint = (ok, text) => (process.stdout.isTTY ? `${ok ? c.green : c.red}${text}${c.reset}` : text);

async function main() {
  let paths = await getPaths();
  if (LIMIT) paths = paths.slice(0, LIMIT);

  if (!JSON_OUT) {
    console.log(`\n${c.bold}audit-smoke${c.reset} ${c.dim}→ ${BASE}${c.reset}`);
    console.log(`${c.dim}страниц: ${paths.length}, параллельно: ${CONCURRENCY}${c.reset}\n`);
  }

  const results = await pool(paths, CONCURRENCY, async (path) => {
    try {
      const { res, body } = await fetchText(new URL(path, BASE).toString());
      const r = analyze(path, body, res);
      if (r.info.ogImage && !(await checkOgImage(r.info.ogImage))) r.fails.push(`og:image 404 (${r.info.ogImage})`);
      return r;
    } catch (e) {
      return { info: { path }, fails: [`сеть/таймаут: ${e.message}`], warns: [] };
    }
  });

  if (JSON_OUT) {
    const summary = results.reduce(
      (a, r) => ({ pages: a.pages + 1, failed: a.failed + (r.fails.length ? 1 : 0), issues: a.issues + r.fails.length }),
      { pages: 0, failed: 0, issues: 0 },
    );
    console.log(JSON.stringify({ base: BASE, summary, results }, null, 2));
    process.exit(summary.failed ? 1 : 0);
  }

  for (const r of results) {
    const ok = r.fails.length === 0;
    const head = `${ok ? paint(true, '✓') : paint(false, '✗')} ${r.info.path}`;
    const meta = r.info.size ? `${c.dim}${r.info.size} B${c.reset}` : '';
    console.log(`${head}  ${meta}`);
    for (const f of r.fails) console.log(`   ${paint(false, '✗')} ${f}`);
    if (VERBOSE) {
      for (const w of r.warns) console.log(`   ${c.yellow}•${c.reset} ${w}`);
      if (r.info.title) console.log(`   ${c.dim}title: ${r.info.title}${c.reset}`);
    }
  }

  const failed = results.filter((r) => r.fails.length);
  const warns = results.reduce((a, r) => a + r.warns.length, 0);
  const shell = results.filter((r) => r.fails.some((f) => f.includes('заглушка'))).length;

  console.log(`\n${c.bold}Итого:${c.reset} ${results.length} страниц, ${failed.length ? paint(false, failed.length + ' с провалами') : paint(true, '0 провалов')}, ${warns} предупреждений`);
  if (shell) console.log(`${paint(false, '⚠')} ${shell} страниц отдают оболочку без контента — начните с фикса домена/SSR.`);
  if (failed.length && VERBOSE) {
    const byCheck = {};
    for (const r of failed) for (const f of r.fails) {
      const key = f.replace(/[:：].*/, '').slice(0, 48);
      byCheck[key] = (byCheck[key] || 0) + 1;
    }
    console.log(`\n${c.bold}Частые проблемы:${c.reset}`);
    for (const [k, v] of Object.entries(byCheck).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`  ${v}× ${k}`);
  }
  console.log('');
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error('audit-smoke упал:', e);
  process.exit(2);
});
````


---

## 5. Чек-лист приёмки

Отмечайте после прогона `audit-smoke` и ручной проверки.

**После 01**
- [ ] `curl -s https://sonogyn-pro.ru/tools/o-rads | wc -c` → больше 20 000
- [ ] в HTML нет `vercel.app`
- [ ] нет заголовка `x-sonogyn-cd-proxy`
- [ ] при блокировке `*.vercel.app` сайт продолжает работать

**После 02**
- [ ] `audit-smoke` → 0 провалов по title / description / canonical / H1 / og:image
- [ ] `/` отдаёт лендинг 200, `/landing` → 301
- [ ] `/login`, `/app`, `/profile` — `noindex`
- [ ] превью ссылки в Telegram/VK с картинкой

**После 03**
- [ ] «Начать» → `/register`, «Войти» → `/login`
- [ ] на `/home` есть вход и демо-режим
- [ ] регистрация: ≤ 3 обязательных поля на первом шаге
- [ ] чекбокс согласия обязателен
- [ ] пройден путь лендинг → регистрация → кабинет → калькулятор → paywall без тупиков

**После 04**
- [ ] оплата либо работает (тестовая карта → PRO выдан), либо на проде нет цены и кнопок «Оплатить»
- [ ] ключи только на сервере, `service_role` отсутствует в клиентском бандле
- [ ] вебхук идемпотентен

**После 05**
- [ ] в футере юрлицо + ИНН + ссылки на политику/оферту/контакты
- [ ] `/offer` и `/contacts` опубликованы
- [ ] cогласие фиксируется (дата + версия документа)
- [ ] из публичных текстов убрано «не замена консультации юриста» и ник

**После 06**
- [ ] `npx @axe-core/cli http://localhost:3000/pricing --exit` → 0 critical/serious
- [ ] H1 на тарифах читается (контраст ≥ 4,5:1)
- [ ] калькулятор проходится только клавиатурой
- [ ] каждое поле озвучивается скринридером

**После 07**
- [ ] LCP mobile < 2,5 с
- [ ] JS первого экрана < 250 КБ gzip
- [ ] баннер установки не перекрывает контент и не на первом визите
- [ ] один манифест, `start_url: /`

**После 08**
- [ ] до согласия нет запросов к Метрике/GA
- [ ] события видны в отладчике
- [ ] Sentry не отправляет содержимое полей

**После 09**
- [ ] 10 страниц: > 400 слов, источники, дата, «проверил врач»
- [ ] с лендинга ≥ 8 ссылок на калькуляторы
- [ ] FAQ-разметка соответствует видимому FAQ

---

## 6. Что делает человек (агент бессилен)

1. **Юрлицо:** ИП/ООО, ИНН, ОГРН, адрес — без этого Politikа и оферта недействительны.
2. **Роскомнадзор:** уведомление об обработке ПДн; решение по трансграничной передаче (Supabase eu-west-1) или перенос БД в РФ.
3. **ЮKassa:** договор, магазин, ключи, тестовые карты, чеки, возвраты.
4. **DNS и панели:** домен, Vercel, Cloudflare (если прокси — Worker, его отключение/деплой).
5. **Врачебное ревью** всех медицинских текстов и формул.
6. **RuStore / App Store:** аккаунты, скриншоты, политика приватности для стора.
7. **Юрист:** финальная проверка политики, оферты, дисклеймеров.

---

## 7. Порядок и режим работы

1. Ветка на задачу, PR в `main`, ревью диффа человеком.
2. Перед задачей — checkpoint в Cursor (Restore при уходе в сторону).
3. После задачи — `audit-smoke` + команды из блока «Проверка».
4. `01` не закрыта — не начинать `02` (метаданные некому отдавать).
5. Не просить агента «исправить всё сразу»: получите дифф на 400 файлов и красную сборку.

**Стоп-сигналы в работе агента:**
- правит файлы вне задачи → остановить;
- пишет «готово» без вывода команд → потребовать прогон;
- «починил прокси», хотя в репозитории его нет → проверить, не выдумал ли;
- добавляет зависимости без спроса → отклонить;
- трогает RLS, CSP, ключи → отклонить;
- придумывает ИНН, цены, медицинские цифры → отклонить.
