# Аналитика SonoGyn Pro

Слой воронки без ПДн и без полей калькуляторов. Счётчики грузятся **только после** согласия в cookie-баннере.

## Env

| Переменная | Назначение |
|---|---|
| `NEXT_PUBLIC_YM_ID` | ID счётчика Яндекс.Метрики (цифры). Без ID — скрипт не грузится. |
| `NEXT_PUBLIC_GA_ID` | GA4 Measurement ID (`G-…`). |
| Firebase `NEXT_PUBLIC_FIREBASE_*` | Опционально; тоже за consent. |
| `SENTRY_*` / `NEXT_PUBLIC_SENTRY_DSN` | Ошибки (уже с scrub PHI). |
| `SONOGYN_LOG_SERVER_TIMING=1` | Opt-in серверные timing-логи без ПДн. |

## Consent

1. Необходимые cookies сессии — всегда.
2. Баннер (`CookieConsentBanner`) — если настроен YM / GA / Firebase и выбор ещё не сделан.
3. Выбор в `localStorage` (`sonogyn_analytics_consent`) + событие `sonogyn-analytics-consent`.
4. Аудит: `POST /api/analytics/consent` → `analytics_events` (`event_name=analytics_consent`).
5. Футер: «Настройки cookie» → повторный баннер.

До согласия сетевых запросов к `mc.yandex.ru` / `googletagmanager` / GA нет.

## События (`track` / `lib/analytics.ts`)

| Событие | Параметры | Где |
|---|---|---|
| `landing_view` | — | `/` |
| `cta_click` | `cta`, `placement` | header / hero / footer |
| `signup_start` / `signup_complete` | `method` | RegisterAuthWizard |
| `calculator_open` | `id` | CalculatorLandingShell |
| `calculator_calc` | `id` | API готова; wire по калькуляторам инкрементально |
| `case_save` | — | NewCaseWizard |
| `ai_request` | `mode` | SonogynCopilot |
| `paywall_view` / `checkout_start` / `checkout_success` | `plan` | `/paywall` |
| `install_prompt_shown` / `install_accepted` | — | PwaInstallBanner |

Дублирование: `dataLayer` + `gtag('event')` + `ym(id, 'reachGoal', …)` при наличии согласия и ID.

## Дашборд (ручной)

В Метрике / GA4 собрать воронку:

1. `landing_view` → `cta_click` / `signup_start` → `signup_complete`
2. `calculator_open` → (позже `calculator_calc`) → `case_save` / `ai_request`
3. `paywall_view` → `checkout_start` → `checkout_success`
4. Retention W1/W4 — отчёты Метрики по визитам + cohort в GA4
5. Топ калькуляторов — группировка по `calculator_open.id`
6. Доля мобильных — стандартный отчёт устройств

SQL (admin): `analytics_events` + экспорт Firebase (если включён).

## Проверка

```bash
# без ID / без consent — в HTML нет tag.js
curl -s http://localhost:3000/ | grep -c "mc.yandex.ru"   # ожидаем 0 до согласия

# после «Разрешить аналитику» + NEXT_PUBLIC_YM_ID — Network: mc.yandex.ru/metrika/tag.js
```

## Нужно от владельца продукта

1. `NEXT_PUBLIC_YM_ID` (счётчик Метрики).
2. `NEXT_PUBLIC_GA_ID` (опционально GA4).
3. Подтверждение, что Sentry DSN уже в Vercel (для 5xx / hydration).
4. Доступ к кабинету Метрики / GA для воронки выше.
