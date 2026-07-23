# Claude Code — SonoGyn Pro monorepo

Проект: клиническая платформа УЗИ/АГ (Next.js web + Expo mobile + пакеты калькуляторов).

## Контекст

- Читай `about-me.md` и `ai-style.md` в корне.
- Web: `apps/web` (Next.js 16, Supabase Auth, Vercel).
- Mobile: `apps/mobile` (Expo).
- Видео: `apps/video` (Remotion Studio, вертикальные ролики 1080×1920).
- Медицина: O-RADS, BI-RADS, TI-RADS, IOTA, FIGO — только по гайдлайнам и КР.

## Команды

```bash
pnpm install:deps
pnpm dev:web          # http://localhost:3000
pnpm dev:video        # Remotion Studio
pnpm typecheck
```

## Правила

- Не коммитить без явной просьбы.
- Не удалять существующие модули без запроса.
- Секреты — только в `.env.local`, не в git.
- Тон ответов: русский, пошагово, для врача-фаундера без опыта в коде.

## Remotion

- Композиции: `apps/video/src/compositions/`
- Регистрация: `apps/video/src/Root.tsx`
- Рендер: `pnpm --filter @repo/video render SonoGynTip out/file.mp4`
