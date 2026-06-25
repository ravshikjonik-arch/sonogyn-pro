# TODO

## Mobile

- [x] **OAuth / AuthProvider types** — `SupabaseAuthScreen`: `telegram` отфильтрован в `onProviderPress`, OAuth только `google`.

## Пилот (после готовности кода)

### Равшан (ручно, ~15 мин)

- [x] **Vercel prod env** — SMSRU_API_ID, AUTH_EMAIL_ONLY=false, Upstash/KV, redeploy (проверено: smsReady=true).
- [x] **Supabase prod** — `cases_orads_tags` + `security_hardening` применены (MCP, 2026-06-26).
- [ ] **Auth SMS** — прогнать вход/регистрацию по SMS на реальном номере (sms.ru, до 10 мин).
- [ ] **EAS build** — `cd apps/mobile && npm run eas:android:preview` (или `eas:all:preview`); на устройстве проверить push-токен в `user_push_tokens`.
- [ ] **Discussions e2e** — web + mobile: вопрос → ответ → push → deep link.

### Код (закрыто ассистентом)

- [x] CI lockfile + wave 3 Zod (mobile exchange, webhook)
- [x] Wave 4 Zod (send-code, verify-code, resend-confirmation, mfa/verify-login, notify)
- [x] Security E2E fix (webhook 400, E2E_DEV_SKIP_AUTH=false)
- [x] Wave 5 Zod (copilot studies create, series create)
- [x] Security E2E в CI (run #28166757988, commit `c95aa1c`)
- [x] Mobile MVP: калькулятор стеноза ВСА
