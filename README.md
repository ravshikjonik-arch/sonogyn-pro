# Medical Ultrasound Platform (monorepo)

Клиническая платформа для врачей УЗИ и АГ: веб-приложение (Next.js), мобильное (Expo), общие медицинские расчёты и типы.

**Терминал (шпаргалка):** [TERMINAL.md](./TERMINAL.md) — как запускать web/mobile и что делать при типичных ошибках.

## Структура

| Пакет / приложение | Описание |
|--------------------|----------|
| `apps/web` | Next.js 16 — пациенты, протоколы УЗИ, PDF, тёмная тема, Supabase |
| `apps/mobile` | Expo — калькуляторы O-RADS, FMF, гинекология, Firebase |
| `packages/medical-calculations` | EFW (Hadlock, Shepard, Warsof), GA, AFI, допплер, валидация |
| `packages/types` | Zod-схемы и TypeScript-типы |
| `packages/nosology` | Справочник нозологий (IndexedDB, поиск, шаблоны протокола) |
| `packages/clinical-reference` | Клинические нормы УЗИ (КТР, AFI, скрининги) |
| `packages/clinical-guidelines` | КР МЗ РФ, приказы ДЗМ, локальные протоколы (отдельные полки) |

## Быстрый старт

### Требования

- Node.js 20+
- [pnpm](https://pnpm.io) 10.x
- Проект [Supabase](https://supabase.com) (для веб-клиники)
- Firebase (для мобильных кейсов) — опционально

### Установка

```bash
pnpm install:deps
```

### Переменные окружения (веб)

Создайте **`apps/web/.env.local`** (не только в корне):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # только сервер, не в клиент
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Примените SQL-миграции из `apps/web/supabase/migrations/` в Supabase SQL Editor.

### Переменные окружения (мобильное)

`apps/mobile/.env` или Expo secrets:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

### Запуск

```bash
pnpm dev:web      # http://localhost:3000
pnpm dev:mobile   # Expo
```

### Проверки

```bash
pnpm typecheck
cd packages/medical-calculations && pnpm test
```

## Справочник нозологий

- **Врач:** `/nosologies` → выбор заболевания → вкладки с алгоритмами → **«В протокол»**
- **Из протокола:** кнопка **«📋 Нозологии»** у поля диагноза (workspace исследования)
- **Админ:** `/admin/nosologies` — добавление/редактирование, экспорт/импорт JSON
- **Данные по умолчанию:** `packages/nosology/src/data/nosologies.seed.json`
- **Редактирование сида:** измените JSON и увеличьте `SEED_VERSION` в `nosologyStore.ts`, либо правьте через админку (сохраняется в IndexedDB браузера)
- **PDF (опционально):** `NEXT_PUBLIC_NOSOLOGY_PDF_URL` в `.env.local` — iframe на вкладке «Первоисточник»

```bash
cd packages/nosology && npm test
```

## Визуализация матки (3D)

- Маршрут `/uterus-3d` — учебный workspace (2D-план + 3D)
- В **протоколе УЗИ** — кнопка **«3D модель»** у поля «Матка»: маркеры, FIGO, масштаб модели, экспорт в текст и PNG
- Пакет `@clinical/uterus` — Three.js / React Three Fiber

```bash
cd apps/web/packages/clinical-uterus && pnpm test
```

## Клинический справочник

Встроенные методики измерений (без PDF/сканов сторонних изданий):

- Пакет `@repo/clinical-reference` — темы, поиск, подсказки к полям протокола
- **Веб:** `/reference` — оглавление и поиск
- **Mobile:** Библиотека → «Клинические нормы УЗИ»

Редактирование текстов: `packages/clinical-reference/src/topics.ts`

## Клинические рекомендации и приказы

Отдельный виджет (не смешивается с нозологиями и клин. нормами):

- **Web:** `/guidelines` — полки: КР МЗ РФ · приказы ДЗМ · приказы МЗ · международные
- **Mobile:** вкладка «КР и приказы»
- **Пакет:** `packages/clinical-guidelines/src/catalog/` — каждая полка в отдельном файле
- **Наполнение:** добавляйте документы в соответствующий файл полки (`kr-mz-rf-obgyn.ts`, `orders-dzm.ts`, …)

## Клинический функционал (веб)

- **Клин. нормы** — `/reference` — методики КТР, БПР, AFI, допплер и др.
- **КР и приказы** — `/guidelines` — КР МЗ, приказы ДЗМ, протоколы (отдельные полки)
- **Пациенты** — `/patients` — CRUD, поиск, ПМП, история исследований
- **Протокол УЗИ** — в workspace исследования — фетометрия, EFW, AFI, допплер, заключение
- **PDF** — печать / сохранение через браузер
- **Беременность** — `/patients/[id]/pregnancy` — график EFW, напоминания о скринингах
- **Тёмная тема** — переключатель в шапке, сохранение в localStorage
- **Эластография** — `/calculators/elastography` (раздел «Calculators», общий расчёт с mobile)

## Безопасность

- Аутентификация через Supabase Auth (пароли хешируются на стороне Supabase)
- Роли: `user`, `moderator`, `admin` в таблице `profiles`
- Локальные черновики протокола — AES-GCM (Web Crypto)
- PHI не логируется в консоль (`safeLog`)

Перед продакшеном: BAA, аудит, шифрование at-rest в БД, соответствие 152-ФЗ / HIPAA.

## Документация изменений AI

См. [CHANGELOG_AI.md](./CHANGELOG_AI.md).
