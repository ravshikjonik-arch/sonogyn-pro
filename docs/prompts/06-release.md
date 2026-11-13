# Этап 6. Релиз и откат (Vercel + Supabase first)

```
Ветка: chore/release. Ничего не выкатывать без явной команды владельца.

НЕ заменять текущий прод (Vercel web + Supabase + домен sonogyn-pro.ru) на Docker Compose «с нуля».
Docker/VPS РФ — только как ОПЦИОНАЛЬНОЕ приложение в docs (когда решите суверенитет/on-prem).

Сделать:
1. docs/RELEASE_CHECKLIST.md: typecheck, lint, e2e critical, copyright, privacy, дисклеймеры,
   rate limit, Turnstile/Stripe env, RLS advisors.
2. Процедура promote/rollback на Vercel (preview → production, previous deployment).
3. Мониторинг: что уже есть (Sentry и т.д.) + пробелы; алерт в Telegram если уже принят в проекте.
4. Бэкап Supabase + проверка восстановления (ссылка на docs/BACKUP.md из этапа 1).
5. Рекомендации по нагрузке «первая тысяча врачей» на текущем стеке; когда нужен отдельный VPS.

Итог: чеклист + runbook. Deploy только по фразе владельца («деплой» / «комит деплой»).
```
