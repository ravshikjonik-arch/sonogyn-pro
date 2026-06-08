# Medical Ultrasound Platform

Next.js App Router + TypeScript + Tailwind CSS + Supabase auth starter for a medical ultrasound web platform.

Версия пакета синхронизирована с релизом монорепозитория (**сейчас 0.2.0**). После деплоя пользователь получает актуальный код при открытии сайта; отдельного обновления «приложения» на Android для этого продукта нет.

Проверка ESLint из корня репозитория: `npm run check:web`.

## Стек и возможности

- **Auth**: Supabase (`utils/supabase/`, `middleware.ts`).
- **Workspace / исследования**: `app/(auth)/workspace/`, таблицы `studies`, `patients` и др. через Supabase.
- **API Copilot / CDS**: `app/api/copilot/` — регистрация изображений, серии, превью CDS (`cds-preview`).

## Getting Started

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Useful commands:

```bash
npm run lint
npm run build
npm run start
```

## Project Structure

- `app/` - Next.js App Router pages and layouts.
- `app/(auth)/` - protected route group.
- `app/login` and `app/register` - Supabase auth pages.
- `utils/supabase/` - Supabase browser, server and middleware clients.
- `middleware.ts` - protected route middleware for `/dashboard` and `/profile`.
- `public/manifest.json` - public PWA manifest.
- `public/sw.js` - placeholder service worker for future PWA caching.

## PWA

The project includes:

- `manifest.json` in the project root.
- `public/manifest.json` served to browsers.
- `app/icon.png` and `public/icon.png` placeholder icons (`512x512`).
- PWA metadata in `app/layout.tsx`.
- `public/sw.js` placeholder for a future service worker.

## Deploy on Vercel

1. Push the project to GitHub/GitLab/Bitbucket.
2. Create a new Vercel project and import the repository.
3. Set the framework preset to `Next.js`.
4. Add environment variables in Vercel Project Settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. Deploy.

Vercel will run:

```bash
npm install
npm run build
```

After deployment, update Supabase Auth settings:

- Add your Vercel production URL to allowed redirect URLs.
- Add local development URL `http://localhost:3000` for local testing.
