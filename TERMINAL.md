# Терминал — шпаргалка (SonoGyn Pro)

Один файл, без магии: открыл терминал → скопировал команды → работаешь сам.

**Фаундер / подпись кабинета:** Якубов Равшан Вахобжонович → в UI **Якубов Р.В.**

## Быстрый вывод в терминал (ссылки + статус портов)

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run terminal:info
```

Покажет: занят ли `:3000`, LAN IP Mac, ссылки на `/app`, калькуляторы, подсказки по `.env.local`.

### Импорт нозологий (база помощника врача-гинеколога; файл `помощник от петра.docx`)

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run import:petra
```

Docx: `/Users/yakrav7700/Desktop/помощник от петра.docx`  
JSON: `apps/mobile/src/gynecology/obgynAssistantImportedGynecology.json` + `…Obstetrics.json`  
UI: `/assistant/gynecology` → клик по МКБ → окно маршрута (анализы, УЗИ, лечение).

---

## Где что лежит (структуру не трогаем)

| Что | Папка | Порт |
|-----|--------|------|
| **Web** (Next.js) | `apps/web` | **3000** |
| **Mobile** (Expo) | `apps/mobile` | **19001** |
| Общие формулы (EFW, эластография…) | `packages/medical-calculations` | — |
| **КР и приказы** | `packages/clinical-guidelines` | `/guidelines` |
| Эластография **web UI** | `apps/web/components/calculators/elastography` + `lib/calculators/elastography` | `/calculators/elastography` |
| Эластография **mobile** | `apps/mobile/src/modules/elastography` | экран в приложении |

Новые фичи добавляем **внутрь** этих папок, корень монорепо не раздуваем.

---

## Каждый день — 2 шага

### 1. Один раз после `git pull` или если что-то «Module not found»

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run install:deps
```

(То же самое, что `pnpm install` из корня.)

### 2. Запуск web (Mac)

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run dev:web
```

По умолчанию **Turbopack** (быстрее переключение страниц). Если что-то ломается: `cd apps/web && npm run dev:webpack`.

Открыть в браузере на Mac:

- http://127.0.0.1:3000 — главная
- http://127.0.0.1:3000/app — **кабинет врача** (подпись **Якубов Р.В.** после ФИО в профиле)
- http://127.0.0.1:3000/register — регистрация (ФИО: `Якубов Равшан Вахобжонович`)
- http://127.0.0.1:3000/profile — профиль / ФИО
- http://127.0.0.1:3000/calculators — каталог
- http://127.0.0.1:3000/calculators/o-rads — O-RADS
- http://127.0.0.1:3000/calculators/endometrium — эндометрий
- http://127.0.0.1:3000/calculators/elastography — эластография **без входа**
- http://127.0.0.1:3000/guidelines — КР и приказы

### 2б. Телефон в той же Wi‑Fi (LAN)

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run dev:web:lan
```

В терминале ищите строку **Network:** — это IP Mac (сейчас часто `172.16.252.215`).

Или сразу: `npm run terminal:info` — выведет актуальный IP.

На телефоне (Safari / Chrome), **та же сеть Wi‑Fi**, не мобильный интернет:

- `http://<IP-из-Network>:3000/app` — кабинет врача
- `http://<IP-из-Network>:3000/calculators/o-rads`
- `http://<IP-из-Network>:3000/calculators/endometrium`
- `http://<IP-из-Network>:3000/calculators/cervical-length`

**Не открывайте** `http://0.0.0.0:3000` — только `127.0.0.1` на Mac или LAN IP на телефоне.

Узнать IP вручную:

```bash
ipconfig getifaddr en0
```

Если не открывается: macOS → Системные настройки → Сеть → Firewall — разрешить Node, или временно выключить firewall для теста.

Для UI без логина в dev: в `apps/web/.env.local`:

```env
DEV_SKIP_AUTH=true
DEV_LOGIN_FULL_NAME=Якубов Равшан Вахобжонович
DEV_LOGIN_EMAIL=...
DEV_LOGIN_PASSWORD=...
```

Только локально, не для production.

### Mobile (если нужен телефон / Expo)

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run dev:mobile
```

QR / Expo — порт **19001**.

---

## Если вылезла ошибка — только ручные команды

### `Cannot find module './flags'` (lightningcss / next/font)

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
node scripts/fix-lightningcss-flags.js
```

Потом снова `cd apps/web && npm run dev`.

### `Can't resolve 'jay-peg'` (калькуляторы / PDF)

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run install:deps
```

В `apps/web` пакет `jay-peg` уже в зависимостях — после install перезапустите dev.

### `Can't resolve 'react-style-singleton'`

```bash
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run install:deps
```

В `apps/web/package.json` пакет уже прописан явно — после install должно пройти.

### Порт занят / «Another next dev server is already running»

Обычно висит **второй** `next dev`. Остановить всё на 3000–3001 и lock:

```bash
lsof -ti:3000 -ti:3001 | xargs kill -9 2>/dev/null
rm -f apps/web/.next/dev/lock
cd /Users/yakrav7700/Desktop/05-04-2026_11-45-39
npm run dev:web:lan
```

Или один PID из сообщения Next: `kill -9 29927`

Не запускайте одновременно `npm run dev:web` и `npm run dev:web:lan` в двух терминалах.

### Тормозит / «нозология не открывается»

1. **Помощник врача** (`/assistant/gynecology`) — маршрут открывается **под списком** карточек; после клика страница прокручивается вниз.
2. **Справочник** (`/nosologies`) — первый клик в dev может ждать компиляцию 1–3 с; дальше быстрее. Данные в IndexedDB на устройстве.
3. Белый экран / 500 — перезапуск: `lsof -ti:3000 | xargs kill -9`; `rm -f apps/web/.next/dev/lock`; `npm run dev:web:lan`.

Или другой порт (если 3000 нужен другому приложению):

```bash
cd apps/web
npm run dev:3001
```

→ http://127.0.0.1:3001

---

## Проверки перед коммитом (по желанию)

```bash
# web
cd apps/web && npx tsc --noEmit

# mobile
cd apps/mobile && npx tsc --noEmit

# формулы + эластография в пакете
cd packages/medical-calculations && npx tsc --noEmit
```

---

## Важно для работы с Cursor Agent

- **Структуру** (`apps/`, `packages/`) не менять без явного запроса.
- **`.npmrc`**, `install:deps`, `node_modules` — только ты или явная команда «почини зависимости».
- Новый калькулятор web → `apps/web/components/calculators/…` + `lib/calculators/…` + страница в `apps/web/app/(clinical)/calculators/…`
- Общая логика расчётов → `packages/medical-calculations/src/…`

---

## Env (кратко)

| Приложение | Файл |
|------------|------|
| Web | `apps/web/.env.local` |
| Mobile | `apps/mobile/.env` |

Без `.env.local` web откроется, но логин/Supabase могут не работать — это нормально для просмотра UI.
