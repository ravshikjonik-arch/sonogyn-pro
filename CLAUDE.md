# Claude Code — SonoGyn Pro monorepo

Проект: клиническая платформа УЗИ/АГ (Next.js web + Expo mobile + пакеты калькуляторов).

## Контекст

- Читай `about-me.md` и `ai-style.md` в корне.
- Web: `apps/web` (Next.js 16, Supabase Auth, Vercel).
- Mobile: `apps/mobile` (Expo).
- Видео: `apps/video` (Remotion Studio, вертикальные ролики 1080×1920).
- Медицина: O-RADS, BI-RADS, TI-RADS, IOTA, FIGO — только по гайдлайнам и КР.
- Правила MCP: `.cursor/rules/mcp-safety.mdc`.

## Команды

```bash
pnpm install:deps
pnpm dev:web          # http://localhost:3000
pnpm dev:video        # Remotion Studio
pnpm typecheck
pnpm lint
pnpm test:e2e
pnpm --filter @repo/web test:e2e:cpi
pnpm --filter @repo/web test:e2e:a11y
pnpm --filter @repo/web test:e2e:security
pnpm --filter @repo/web test:lighthouse
```

## MCP (безопасно по умолчанию)

- Cursor: `.cursor/mcp.json` — Playwright `@0.0.78`, Context7 `@3.2.5`, Figma remote.
- Wave 3 example: `.cursor/mcp.wave3.example.json` (Firecrawl/Sentry после ключей).
- Supabase MCP: без явного запроса — только metadata/docs; запрещены SQL/migrations/branch destructive ops.
- Не печатать секреты; не тащить ПДн/медданные в чат.

## Правила

- Не коммитить без явной просьбы.
- Не удалять существующие модули без запроса.
- Секреты — только в `.env.local`, не в git.
- Тон ответов: русский, пошагово, для врача-фаундера без опыта в коде.

## После изменений

Краткий отчёт: изменения → typecheck/lint/tests → ручной smoke → риски.

## Remotion

- Композиции: `apps/video/src/compositions/`
- Регистрация: `apps/video/src/Root.tsx`
- Рендер: `pnpm --filter @repo/video render SonoGynTip out/file.mp4`
