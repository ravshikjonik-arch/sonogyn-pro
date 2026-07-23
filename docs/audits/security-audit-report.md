# Security Audit — SonoGyn Pro
Дата: 2026-07-21
Объект: platforms/monorepo в Desktop/05-04-2026_11-45-39
Режим: независимый технический эксперт + product analyst

# 1. Резюме для инвестора
Платформа имеет серьезную базу: Supabase Auth, middleware с ролями, частичную тотальную валидацию и защитные заголовки. Но есть критические ниточки: потенциальные запросты к чужим данным, слабые точки на авторизации CORS/токенах и тонкая защита админки. Сейчас это G6/G7 по шкале готовности к пилоту; с доработкой 2 недель можно выйти на G8.

# 2. Оценки
| Блок | Балл | Суть |
|---|---|---|
| Авторизация | 6/10 | Базовая верifikейшена + роли. Но нет централизованного security audit log, нет блокировки всех левых прямых запросов |
| Session/token | 6/10 | Есть PKCE + SecureStore на мобилке, но требуется проверка сценариев logout-all/обновления |
| API guards | 7/10 | Большинство owner-checked, но есть открытые энтрипоинты без лимитирования |
| CSRF/CORS | 5/10 | CORS частично настроен, CSRF не подтвержден явно |
| OWASP | 6/10 | XSS частично, инъекции снижены, недостает запрета прямого доступа к чужим данным |
| Infra/Vercel | 7/10 | Заголовки + bot block; но нет файрволов/DDOS на провайдер уровне |
| UX | 8/10 | Понятные формы, CAPTCHA, MFA на месте |
| Код/архитектура | 7/10 | Чистые слои, но дублируется работа пакетов |

# 3. TOP-5 🔴 критических проблем
1. IDOR — часть mutating routes без owner check в теории может давать доступ к чужим данным
2. CSRF — нет явных CSRF-токенов на state-changing endpoints; mobile PKCE не дает полной гарантии на web
3. CORS/Preflight — только общий helper, не подтверждена белая lista origins для production
4. Отсутствие security audit log — нет фиксации подозрительной активности, brute-force, 403/401
5. Админка/провайдеры — нет enforced MFA/2FA для критичных админоператоров, есть зависимость от одного email

# 4. TOP-3 🟢 сильные стороны
- Полноценная ролевая модель в кодексе middleware + admin/author/moderator gates
- Rate limit + CAPTCHA + Turnstile + безопасное логирование ошибок
- Закрытая мобильная сессия через SecureStore + chunked PKCE + legacy migration

# 5. Дополнительные рекомендации
1. Внедрить centralized security audit log и обновлять статусы входа
2. Выпустить explicit CORS whitelist + CSRF double-submit cookie для web
3. Добавить enforce MFA для admins/author roles через TOTP в Supabase
4. Запустить weekly dependency audit + lockfile integrity check
5. Подготовить incident response playbook: как откатить сессии, как забанить пользователя, как отключить регистрацию через 1 вызов Vercel/Supabase

# 6. Дорожная карта
Неделя 1: audit log + IDOR scan + admin MFA + 429 headers + CORS whitelist
Неделя 2: token refresh audit + password-reset TTL + banned-user gate + dependency audit
Месяц 1: signed URLs policy + penetration testing checklist + runbook
Квартал 1: GDPR/PHI review + vendor lock mitigation + infra hardening

# 7. Готовность к пилоту
См. TODO.md. Остались ручные проверки: SMS auth на реальном номере, EAS build, Discussions e2e.
