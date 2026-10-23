# Spatial UI upgrade (2026-10)

## Scope

- Главная `/home` и кабинет `/profile/dashboard`: горизонтальная **колода разделов** + **sheet** (`?hub=rads|…`).
- `SpatialCanvas` + бирюзовый mesh (dark/light), vignette, bottom sheet на mobile.
- Источник инструментов: `@repo/clinical-tools` (без дублирования медицинских формул).
- Тёмная тема: бирюзовый космический mesh (`sonogyn-cosmos-bg`, токены `--mesh-*`).
- Светлая тема: без mesh-неона (как раньше).

## Rollout

1. Preview: ветка `spatial-ui-upgrade` → Vercel preview → smoke `/home?hub=rads`.
2. Production: merge в `main` после CI + ручной проверки O-RADS/BI-RADS (результаты калькуляторов не менялись).

## Rollback

Revert merge commit или Vercel → предыдущий production deployment.

## Завтра (Web Push)

См. `apps/web/docs/chat-v2/TOMORROW-WEB-PUSH.md`.
