# TODO

## Mobile

- [x] **OAuth / AuthProvider types** — `SupabaseAuthScreen`: `telegram` отфильтрован в `onProviderPress`, OAuth только `google`.

## Пилот (после готовности кода)

- [ ] **Auth SMS** — прогнать вход/регистрацию по SMS (sms.ru, задержка до 10 мин; OTP TTL = 10 мин).
- [ ] **EAS build** — preview/production на физическом устройстве, push-токен в `user_push_tokens`.
- [ ] **Discussions e2e** — web + mobile: вопрос → ответ → push → deep link.
