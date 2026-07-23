# Security audit — raw evidence
Дата: 2026-07-21
Объект: SonoGyn Pro, `/Users/yakrav7700/Desktop/05-04-2026_11-45-39`
Цель: тотальная проверка авторизации и безопасности.

## Проверено вручную
- Middleware: routes, dev-bypass, role gates для `/admin` и `/author`, phone-verify gate, security headers
- Web API: 49 routes с path params; owner/role checks подтверждены для patients, studies, reports, CPI cases, author courses
- Webhook: VIDEO_TRANSCODE_WEBHOOK_SECRET обязателен в продакшене, тело валидируется Zod
- Auth UX/callback: forgot-password -> generic msg -> recovery PKCE token
- Mobile auth: SecureStore + chunked storage, legacy migration из AsyncStorage
- Hardcoded secrets grep: совпадения только в `.next`, `products/...` старого проекта, README example; подлинных ключей в текущем источнике не обнаружено
- .env.local: используется, secret boundaries не нарушены в рамках репозитория

## Статус
- Без явного запроса код не меняю.
- Следующий артефакт: детальный отчет и план фиксов.
