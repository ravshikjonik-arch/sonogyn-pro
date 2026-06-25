# TODO

## Mobile

- [x] **OAuth / AuthProvider types** — `SupabaseAuthScreen`: `telegram` отфильтрован в `onProviderPress`, OAuth только `google`.

## Пилот (после готовности кода)

### Равшан (ручно, ~15 мин)

- [ ] **Vercel prod env** — `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `SONOGYN_AUTH_INTERNAL_SECRET` (≥32), убрать `DEV_SKIP_AUTH`.
- [ ] **Supabase prod** — применить `20260608120000_security_hardening.sql` (`cd apps/web && npm run db:migrate:security`).
- [ ] **Auth SMS** — прогнать вход/регистрацию по SMS (sms.ru, задержка до 10 мин; OTP TTL = 10 мин).
- [ ] **EAS build** — `cd apps/mobile && npm run eas:android:preview` (или `eas:all:preview`); на устройстве проверить push-токен в `user_push_tokens`.
- [ ] **Discussions e2e** — web + mobile: вопрос → ответ → push → deep link.

### Код (закрыто ассистентом)

- [x] CI lockfile + wave 3 Zod (mobile exchange, webhook)
- [x] Wave 4 Zod (send-code, verify-code, resend-confirmation, mfa/verify-login, notify)
- [x] Security E2E fix (webhook 400, E2E_DEV_SKIP_AUTH=false)
- [x] Wave 5 Zod (copilot studies create, series create)
- [x] Security E2E в CI (run #28166757988, commit `c95aa1c`)
- [x] Mobile MVP: калькулятор стеноза ВСА
