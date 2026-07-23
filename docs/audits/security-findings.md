# Security findings — proven / unproven
Обновлено: 2026-07-21

## Confirmed
- CORS: helper `apps/web/lib/security/cors.ts` проверяет явный allowlist и выдает preflight заголовки; секреты не выдаются клиенту.
- Env в Next.js: проверенные понятия — только позволенные `NEXT_PUBLIC_*` переменные; серверные ключи живут в `.env.local`/Vercel и не продублированы в клиент.
- Frontend graph: `PatientListClient.tsx`, `TiradsAtlasImage.tsx` — используют публичные env-переменные.

## Needs manual confirmation
- `/api/webinars/status` — диагностический GET, но в фулл-режиме отдает `liveKit.url` и проверяет таблицы через `SUPABASE_SERVICE_ROLE_KEY`. Сейчас не видны auth guards; нужно либо добавить requireDiagnosticsRole, либо отключить полный режим на проде.
- CSRF: нет явного double-submit cookie / CSRF middleware; требуется подтвердить состояние на всех state-changing эндпоинтах.

## Нефункциональные
- `npx tsc --noEmit` выдает глобальные `TS2688`; из наших файлов нет ошибок.

## Следующим
- Завершаю OWASP топ-10 в отчете.
- Предлагаю: закрыть webinars/diagnostics auth и сделать dependency audit вручную.
