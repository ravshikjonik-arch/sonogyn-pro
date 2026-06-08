# SonoGyn Pro — основа продукта

**`apps/mobile`** — главный клиент монорепозитория (Expo/React Native): Android в приоритете,
web/PWA из того же кода. Сайт **`apps/web`** (Next.js) — расширение платформы, не замена этой базы.

**Приоритет платформы — Android.** Релизы и внутренние сборки (APK через EAS),
OTA-обновления и основной сценарий теста заточены под Android. Сборка под iOS
в конфигурации сохранена, но не является текущим фокусом продукта.

Единый бренд и тексты: `src/config/product.ts` · `src/config/branding.ts`.

Мобильное приложение для врача УЗИ и акушера-гинеколога с быстрым расчетом
категории и риска по:

- ACR O-RADS (яичники)
- ACR BI-RADS (молочная железа)

## Что уже реализовано

- Экран выбора калькулятора O-RADS / BI-RADS.
- Ввод ключевых ультразвуковых признаков через быстрые кнопки.
- Автоматическая выдача:
  - категории;
  - диапазона риска;
  - шаблона описания;
  - шаблона заключения.
- Версионирование ruleset (`O_RADS_VERSION`, `BI_RADS_VERSION`).
- Конфиг-ориентированная логика расчета через JSON rules:
  - `src/guidelines/rules.orads.json`
  - `src/guidelines/rules.birads.json`
- Универсальный движок сопоставления правил:
  - `src/guidelines/engine.ts`
- Экран обратной связи (локальное хранение комментариев внутри сессии).
- Кнопка "Проверить обновления гайдлайнов" как основа под онлайн-синхронизацию.

## Важно

Текущие правила в v2 foundation являются демонстрационными. Для клинического применения
обязательно:

1. Сверить алгоритмы с официальной последней версией ACR.
2. Провести медицинскую валидацию формулировок в вашем учреждении.
3. Сделать юридический и регуляторный review.

## Быстрый тест на телефоне (Android)

1) Зависимости монорепозитория (из **корня** репозитория):

```bash
npm run install:deps
```

2) Создай `apps/mobile/.env` (рядом с `apps/mobile/package.json`):

```bash
EXPO_PUBLIC_CHAT_API_URL=http://<IP_твоего_компьютера>:3100
```

3) Запусти API чата (в отдельном терминале):

```bash
cd apps/mobile/server
npm install
npm start
```

4) Запусти Metro и открой на Android:

```bash
# из корня монорепозитория (удобнее для Metro без режима CI):
npm run dev:mobile
```

В другом терминале при необходимости:

```bash
cd apps/mobile
npm run android
```

При странностях кэша Metro: `cd apps/mobile && npm run start:clear`.

## Базовый запуск

Из корня репозитория:

```bash
npm run dev:mobile
```

Из каталога приложения:

```bash
cd apps/mobile
npm install   # или зависимости уже подняты с корня через pnpm
npm run android
npm run web
```

Для эмулятора/устройства iOS скрипт `npm run ios` по-прежнему есть, но не в фокусе релиза.

### Проверки TypeScript и юнит-тестов

```bash
cd apps/mobile
npm run check
```

Из **корня монорепозитория**:

```bash
npx --yes pnpm@10.6.5 --filter @repo/mobile run check
```

## Progressive Web App (production web)

Сборка использует **Expo Web (Metro)** + статические файлы в `public/`:

| Файл | Назначение |
|------|------------|
| `public/manifest.webmanifest` | Установка на Android/desktop, имя, иконки, `start_url: /app` |
| `public/sw.js` | Service Worker: офлайн-оболочка, кэш статики, обработчики push |
| `public/offline.html` | Фолбэк при потере сети после первого визита |
| `public/icon-*.png`, `apple-touch-icon.png` | Иконки установки (генерация: `npm run pwa:icons`) |
| `src/web/pwa.ts` | Регистрация SW, meta, touch-friendly CSS |
| `src/config/pwaWeb.ts` | Единые константы темы/имени |

### Сборка и проверка локально

```bash
cd apps/mobile
npm run web:build
npx serve dist -l 4173
```

Откройте `http://localhost:4173` (**HTTPS на продакшене обязателен** для полного SW и push).

### Релиз (веб / PWA)

1. После каждой выкладки статики поднимите **`CACHE_VERSION`** в `public/sw.js` (это делает автоматически скрипт `npm run version:pilot -- X.Y.Z` при релизе версии), иначе клиенты могут долго держать старый кэш.
2. Push-уведомления (опционально): задайте в `.env` публичный ключ VAPID и endpoint сохранения подписки:

```bash
EXPO_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY=<URL-safe-base64-public-key>
EXPO_PUBLIC_WEB_PUSH_REGISTER_URL=https://your-api.example.com/web-push/subscribe
```

Без этих переменных приложение работает как PWA с офлайн-оболочкой, без серверной доставки push.

## Версии продуктов в репозитории и как обновиться на Android

В монорепозитории зафиксированы связанные релизы **0.2.0** (корень `package.json`, пакет `@repo/web`, клиент `@repo/mobile`; чат-API — своя минорная версия в `apps/mobile/server/package.json`).

### Мобильное приложение (Expo / EAS)

1. **Поднять версию одним скриптом** (обновляет `package.json`, `app.json`, увеличивает `ios.buildNumber` и `android.versionCode`, инкрементирует **`CACHE_VERSION`** в `public/sw.js`):

   ```bash
   cd apps/mobile
   npm run version:pilot -- X.Y.Z
   ```

2. **Новая сборка под Google Play (AAB)** — когда меняются нативные зависимости, SDK или нужна новая версия в магазине:

   ```bash
   cd apps/mobile
   npm run eas:android:prod
   ```

   Затем выгрузите артефакт в [Google Play Console](https://play.google.com/console) (Internal testing → Production). У пользователей обновление приходит через **Play Store** («Обновить» в карточке приложения или автообновление).

3. **Только JS/активы без новой сборки (OTA)** — если на устройстве уже стоит билд с тем же **runtimeVersion** (в `app.json` задано `runtimeVersion.policy: appVersion`, то есть привязка к строке `expo.version`):

   - Соберите и опубликуйте обновление на канал **`production`** (профиль production в `eas.json` теперь с `channel: production`):

     ```bash
     cd apps/mobile
     npm run eas:update:production -- --message "описание изменений"
     ```

   - Пользователь при следующем запуске приложения получит загрузку обновления через **expo-updates** (нужен интернет; первая установка всегда через APK/AAB из EAS или Play).

4. **Внутренний APK для коллег (preview)** — основной канал распространения Android до выхода в магазин:

   ```bash
   cd apps/mobile
   npm run eas:android:preview
   ```

   **OTA только для Android на канал preview** (быстрее, без пересборки iOS/web):

   ```bash
   cd apps/mobile
   npm run eas:update:preview:android -- --message "краткое описание"
   ```

   Установка: скачать APK из EAS Build и открыть на устройстве (разрешить установку из неизвестных источников при необходимости).

### Next.js (`apps/web`, пакет `@repo/web`)

Деплой на хостинг (например Vercel): поднимите `"version"` в `package.json`, затем `npm run build` в CI. Отдельного «обновления на Android» для сайта нет — пользователь открывает актуальный URL в браузере.

### Кратко для Android-пользователя приложения

- **Через Google Play** — как любое приложение: раздел «Обновления» или автообновление.
- **Через внутренний APK** — скачать новый файл сборки и установить поверх (или удалить старую версию при конфликте подписи).
- **OTA (Expo Updates)** — после публикации `eas update` достаточно открыть уже установленное приложение онлайн; новый нативный модуль без нового билда подхватить нельзя.

## Где логика

- `App.tsx` - UI ввода признаков и отображение результата.
- `src/guidelines/orads.ts` - адаптер O-RADS ruleset.
- `src/guidelines/birads.ts` - адаптер BI-RADS ruleset.
- `src/guidelines/rules.orads.json` - правила O-RADS в JSON.
- `src/guidelines/rules.birads.json` - правила BI-RADS в JSON.
- `src/guidelines/engine.ts` - универсальный rule engine.
- `src/guidelines/types.ts` - общие типы результата.

## Чат врачей УЗД (общий сервер)

В приложении вкладка **Чат врачей УЗД** умеет работать в двух режимах:

1. **Без сервера** — кейсы только на этом устройстве (`AsyncStorage`).
2. **С сервером** — регистрация/вход по email и паролю (JWT), общая лента кейсов и комментариев для всех врачей.

### Запуск API чата

```bash
cd server
npm install
npm start
```

Подробности: `server/README.md`.

### Подключение клиента

Создай файл `.env` в папке `apps/mobile` (рядом с `apps/mobile/package.json`):

```bash
EXPO_PUBLIC_CHAT_API_URL=http://localhost:3100
```

На телефоне вместо `localhost` укажи **IP компьютера в Wi‑Fi** (тот же порт).

После изменения `.env` перезапусти Expo (`npm run web` / `expo start`).

## Следующий шаг (рекомендую)

- Подключить backend API с версионируемыми JSON-правилами.
- Реализовать pull-синхронизацию ruleset с проверкой подписи/целостности.
- Вынести чат на HTTPS, PostgreSQL, подтверждение email, модерацию и аудит.
- Добавить экспорт заключения в PDF/EMR.
