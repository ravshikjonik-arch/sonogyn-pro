# Security audit notes — raw findings

Дата: 2026-07-21
Проверял вручную: middleware, guards, handlers, session storage, webhooks, SRE/author/mobile.
Ниже — краткие наблюдения, не итоговый отчет.

## Auth/session
- Middleware защищает основные зоны, есть phone-verify gate.
- Dev-bypass выключен в продакшене; `/api/auth/dev-login` скрыт.
- SMS/OTP имеет edge rate limit; нужен фоновый мониторинг стоимости/злоупотреблений.

## IDOR/owner checks
- Подтверждены owner checks на patients, studies/protocol, reports, CPI cases.
- Author API закрыт через `withAuthorCourseApi` + `assertCourseAccess`; курс Morten закрыт от левых авторов.
- Если добавлять новые resources, проверять `.eq("<owner_column>", auth.userId)` дл каждого запроса.

## Risks/gaps
- Мобильное хранилище токенов: проверить, что нет plain localStorage для сессии; нужен secure storage.
- Webhook endpoints: нужна подпись/секрет и строгая проверка.
- Password reset/MFA: проверить одноразовость и TTL токенов.
- Audit logging: нет явного логгера неудачных входов и подозрительных действий.

## Next
- Составить ТОП-5 проблем и дорожную карту.
- Проверить其余的routes: webhooks, lessons, e2e, admin.
- Сформировать финальный отчет для инвестора.
