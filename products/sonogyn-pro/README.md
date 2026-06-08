# SonoGyn Pro — сохранённая основа продукта

Отдельная папка с **снимком** главного клиента. Рабочая разработка по-прежнему в **`apps/mobile`** (монорепозиторий); сюда копия для архива, имени бренда и «базы», которую не путают с сайтом Next.js.

## Содержимое

| Путь | Назначение |
|------|------------|
| `app/` | Копия `apps/mobile` на момент сохранения (без `node_modules`, `dist`, `.expo`) |
| `SNAPSHOT.json` | Дата, ветка, версия, откуда скопировано |
| `brand/product.ts` | Копия единого конфига бренда |

## Бренд

- **Полное имя:** SonoGyn Pro  
- **Коротко:** SonoGyn  
- **Домены (план):** sonogyn.com · sonogyn.ru  

## Запуск (из снимка `app/`)

Снимок **не** подключён к workspace pnpm. Для ежедневной работы используйте корень репозитория:

```bash
npm run dev:mobile
```

Старт с нуля в браузере: `http://localhost:19001/start`

## Обновить снимок

Из корня репозитория (когда нужно пересохранить базу):

```bash
rsync -a --delete \
  --exclude 'node_modules' --exclude '.expo' --exclude 'dist' \
  --exclude 'android' --exclude 'ios' --exclude 'package-lock.json' \
  apps/mobile/ products/sonogyn-pro/app/
cp apps/mobile/src/config/product.ts products/sonogyn-pro/brand/product.ts
```

## Связь с остальным репозиторием

- **`apps/mobile`** — канонический исходник (Android + PWA)  
- **`apps/web`** — сайт/кабинет Next.js, дополнение, не замена этой базы  
