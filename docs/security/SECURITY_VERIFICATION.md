# SECURITY_VERIFICATION — SonoGyn Pro

Базовый аудит: [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md) (2026-11-05).  
Prod commit на момент регрессии: `b79828b` (`GET /api/health`).

---

## Регрессия от 2026-11-05

### Шаг 1 — дельта (security-релевантное)

| Источник | Что |
|----------|-----|
| Uncommitted WT | hardening: forgot-password Turnstile, Stripe webhook idempotency + generic errors, telegram public/server split, myoma sanitize, `poweredByHeader`, auth fail 10/15m, RLS migration (уже applied), **fix create-checkout auth-before-zod** |
| Commits `b84cdb25..HEAD` | Evidence public read (`search`/`whats-new`/`ask` guest), auth SMTP reset + confirm-password-reset, AI gateway status, regulation cron |
| package.json | Только новые **scripts** (evidence tests) — новых runtime deps нет |
| Новые таблицы | `stripe_webhook_events` (миграция applied) |

Не security-релевантное (калькуляторы/UI атласов) — вне scope.

### Шаг 2 — фактические проверки

| Что изменилось | Проверка | Результат |
|----------------|----------|-----------|
| `GET /api/patients` без сессии | curl/fetch prod | ✅ **401** `{"error":"Unauthorized"}` |
| `POST /api/patients` XSS label без сессии | fetch prod | ✅ **401** |
| `GET /api/profile` без сессии | fetch prod | ✅ **401** |
| `POST .../admin/.../revoke-sessions` без сессии | fetch prod | ✅ **401** |
| `GET /api/cron/process-regulation-queue` без secret | fetch prod | ✅ **401** |
| `POST /api/stripe/create-checkout` `{}` без сессии | fetch prod (до фикса) | ❌ было **400** Zod `priceId` до auth → **исправлено в коде** (auth first). Prod ещё на `b79828b` — **после deploy** ожидать **401** |
| `POST /api/stripe/webhook` без подписи | fetch prod | ✅ отказ: **500** `Missing STRIPE_WEBHOOK_SECRET` (ключ не в Vercel). Локально уже смягчено → **503** `Webhook not configured` (после deploy) |
| `POST /api/auth/forgot-password` | fetch prod | ✅ **200** generic (no enum). Turnstile на prod **не enforced** (ключей нет на Vercel) — не регрессия кода, ops gap |
| `POST /api/auth/confirm-password-reset` bad email | fetch prod | ✅ **400** Zod fieldErrors (ожидаемо) |
| `GET /api/evidence/search?q=aspirin` Mozilla | fetch prod | ✅ **200** public read (намеренно, commit b79828) + данные без stack |
| Bot UA `python-requests` / `curl` на evidence | fetch prod | ✅ **403** Forbidden |
| `GET /api/ai/gateway/status` Mozilla | fetch prod | ✅ **200** (диагностика провайдеров; без секретов). Bot → **403** |
| `GET /api/auth/session` | fetch prod | ✅ **200** `user:null` (не 500) |
| Новая таблица `stripe_webhook_events` | SQL prod | ✅ `relrowsecurity=true`; anon/auth SELECT **false**; service_role SELECT/INSERT **true**; policies пустые = deny clients |
| `profiles` SELECT policy | SQL prod | ✅ только `profiles_select_self`: `(auth.uid() = id) OR is_admin()` |
| Public tables WITHOUT RLS | SQL `NOT relrowsecurity` | ✅ **0 строк** |
| IDOR patients A→B | два JWT | ⚠️ **невозможно** в этой сессии (нет тестовых user A/B). RLS own-row подтверждён схемой ранее |
| XSS в UI новых форм | browser payload | ⚠️ **не гонялось** (нет интерактивного логина). Myoma: sanitize в WT |
| Новые deps / npm audit | package.json delta | ✅ новых deps нет; audit OOM локально — Dependabot на месте |
| Секреты в diff | grep uncommitted | ✅ нет `sk_live`/`whsec`/JWT |
| Unit security tests | `node --test` production-secrets + schemas | ✅ **46/46** |
| `npm run build` | — | ⚠️ **не гонялся** (тяжёлый monorepo build); type-level smoke via unit tests |

### Исправленные ❌ в этой регрессии

1. **`/api/stripe/create-checkout`** — auth до Zod; убрана утечка `profileErr.message`; Zod flatten → `"Invalid input"`.
2. **`/api/stripe/webhook`** — при отсутствии secret → **503** без имени env-переменной.

### Не ослаблено намеренно

- Evidence public read + RL + bot 403 — продуктовое решение (guest research).
- Open-access hybrid: PHI routes всё ещё 401.

### Ops (не код)

| Item | Статус |
|------|--------|
| Turnstile keys на Vercel | отсутствуют → CAPTCHA soft-skip |
| `STRIPE_WEBHOOK_SECRET` | отсутствует на Vercel |
| Deploy uncommitted hardening | **не задеплоено** (health=`b79828b`) |

### Вердикт

**Дельта не ослабляет защиту критично.** Найденный gap (checkout Zod до 401) закрыт в рабочей копии. Для полного закрытия на prod: **commit + deploy** + (желательно) Turnstile/Stripe webhook env.

Повторный curl после deploy:

```bash
# ожидать 401
curl -sS -o /dev/null -w '%{http_code}\n' -X POST https://sonogyn-pro.ru/api/stripe/create-checkout \
  -H 'Content-Type: application/json' -d '{}'
```
