# Codex — SonoGyn Pro monorepo

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
pnpm test:e2e         # полный Playwright (apps/web)
pnpm --filter @repo/web test:e2e:cpi
pnpm --filter @repo/web test:e2e:auth
pnpm --filter @repo/web test:e2e:a11y
pnpm --filter @repo/web test:e2e:security
pnpm --filter @repo/web test:lighthouse
pnpm --filter @repo/web test:security
```

A11y soft by default; strict: `A11Y_STRICT=true`. Lighthouse soft by default; strict: `LIGHTHOUSE_STRICT=1`.

## MCP (безопасно по умолчанию)

- Cursor project MCP: `.cursor/mcp.json` — Playwright `@0.0.78`, Context7 `@3.2.5`, Figma + Sentry remote MCP.
- Firecrawl: только после `FIRECRAWL_API_KEY` — блок в `.cursor/mcp.wave3.example.json`.
- `gh`: предпочтительно `~/.local/bin/gh` (без Homebrew); `gh auth login` — вручную один раз.
- Plugins (Cursor): Supabase, Vercel; Slack — только после явного auth-запроса.
- Visual smoke (opt-in): `pnpm --filter @repo/web test:e2e:visual` (+ `--update-snapshots` для baselines).
- Supabase MCP без явного запроса: только metadata/docs (`list_*`, `get_*`, `search_docs`, `get_advisors`).  
  Запрещены: `execute_sql`, migrations, branch merge/reset/delete, pause/restore, deploy edge functions.
- Vercel MCP без явного запроса: без `deploy_to_vercel` и `buy_*`.
- Секреты и токены не печатать; в отчётах — имя переменной + статус.

## Данные и клинический контент

- Не читать и не логировать персональные/медицинские данные пациентов в чат.
- Clinical decision support: классификации только по гайдлайнам и КР; заключение + дисклеймер «не диагноз».
- Секреты — только в `.env.local`, не в git.

## Правила

- Не коммитить без явной просьбы.
- Не удалять существующие модули без запроса.
- Тон ответов: русский, пошагово, для врача-фаундера без опыта в коде.

## GitHub CLI

- Remote: `github` → `ravshikjonik-arch/sonogyn-pro`.
- Если `gh` нет в PATH: установить Homebrew, затем `brew install gh` и `gh auth login` (только по явному запросу).
- Для PR/issues предпочитать `gh` (read metadata) вместо широкого GitHub MCP-токена.

## После изменений (мини-отчёт)

1. Что изменено (файлы / модули).
2. Команды: `typecheck` / `lint` / затронутые tests (или почему не гонялись).
3. Ручная проверка (маршрут / smoke).
4. Риски / что не трогали (prod DB, deploy, secrets).

## Remotion

- Композиции: `apps/video/src/compositions/`
- Регистрация: `apps/video/src/Root.tsx`
- Рендер: `pnpm --filter @repo/video render SonoGynTip out/file.mp4`
