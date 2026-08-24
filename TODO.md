# TODO

## Mobile

- [x] **OAuth / AuthProvider types** — `SupabaseAuthScreen`: `telegram` отфильтрован в `onProviderPress`, OAuth только `google`.
- [x] **СВД dating** — `ScreenMsd` + `gyn_ga_msd` в GynecologyRouter / GynHub.

## Пилот (после готовности кода)

### Равшан (ручно, ~15 мин)

- [x] **Vercel prod env** — SMSRU_API_ID, AUTH_EMAIL_ONLY=false, Upstash/KV, redeploy (проверено: smsReady=true).
- [x] **Supabase prod** — `cases_orads_tags` + `security_hardening` применены (MCP, 2026-06-26).
- [ ] **Auth SMS** — прогнать вход/регистрацию по SMS на реальном `+79…` (sms.ru, до 10 мин). Инфра: `smsReady=true`; при `204` — убрать/одобрить `SMSRU_FROM` на Vercel.
- [ ] **EAS build** — Gradle всё ещё падает (`EAS_BUILD_UNKNOWN_GRADLE_ERROR`). Архив починен (`.easignore`: было ~200MB с `.git`, стало ~20MB). Нужен хвост фазы **Run gradlew** (`FAILURE:`). Сборка: https://expo.dev/accounts/yakrav7700/projects/us-risk-calc/builds/b6e00e65-dfec-493a-ac01-5869082ad969
- [x] **Discussions web↔web e2e** — `npm run pilot:discussions-e2e` (вопрос+ответ двух авторов). Push/deep-link — после APK + строка в `user_push_tokens`.

#### Гайд пилота (волна 1)

1. **SMS auth**
   - Открыть https://sonogyn-pro.ru/register на телефоне.
   - Ввести реальный номер (+7…), дождаться SMS (TTL до 10 мин).
   - Проверить: вход → `/dashboard`, профиль с `phoneVerified`.
   - Если нет SMS: Vercel → `SMSRU_API_ID`, redeploy; `/api/auth/status` → `smsReady: true`.

2. **EAS build**
   ```bash
   cd apps/mobile
   npm run eas:android:preview
   ```
   - Установить APK/AAB на устройство.
   - Войти → Settings → убедиться, что push разрешён.
   - Supabase → `user_push_tokens` — строка с вашим `user_id`.

3. **Discussions e2e**
   - Web: `/cases` → открыть кейс → задать вопрос.
   - Другой аккаунт (или mobile) → ответ.
   - Проверить push на mobile + deep link в кейс.

### Код (закрыто ассистентом)

- [x] **Pilot wave-1 smoke** — `npm run pilot:smoke` на prod (2026-06-29): 6/6 OK, `smsReady=true`
- [x] **Pilot case E2E** — lifecycle R6 + feed (2026-06-29)
- [x] **FMF fetal slices / ОТТЕНКИ 2024** — сняты с публикации (`archived`, 2026-08-03); карточка убрана из library-catalog
- [x] **Pilot closeout T0–T5** — prod smoke + Evidence Perplexity + case E2E + RADS/FMF/library (2026-07-26)
- [x] **Discussions web↔web e2e** — `npm run pilot:discussions-e2e` (вопрос+ответ двух авторов); push/deep-link — после APK
- [x] CI lockfile + wave 3 Zod (mobile exchange, webhook)
- [x] Wave 4 Zod (send-code, verify-code, resend-confirmation, mfa/verify-login, notify)
- [x] Security E2E fix (webhook 400, E2E_DEV_SKIP_AUTH=false)
- [x] Wave 5 Zod (copilot studies create, series create)
- [x] Security E2E в CI (run #28166757988, commit `c95aa1c`)
- [x] Mobile MVP: калькулятор стеноза ВСА
- [x] Wave 6 Zod: forgot/update-password, UUID guards (enroll, studies, lessons complete)
- [x] Wave 7 Zod: AI assist, webinar, author video upload, e2e/dev-login (batches 1–3)
- [x] ILIKE: `escapeLikePattern` на `/api/courses` (patients уже было)
- [x] brain-engine: `lateral_ventricle_body` mapping
- [x] Mobile upload magic bytes — `@repo/upload-validation` в `casesService.ts`
- [x] CSP enforcing — `next.config.ts` Content-Security-Policy (prod)

## Архив Медведева

- [x] Extraction 96/96 JPEG → JSON
- [x] MSD (1.1) + КТР (1.2) + A.3 в runtime
- [x] **verified — 47/96** (сверка с PDF «Фетометрия 2024» под ред. Алтынник + ручная)
- [ ] **5 partial tables** — всё ещё неполные (2.60, 2.56, A.4, 2.8, 2.57)
- [ ] **44 unverified** — нужны доп. источники (региональные, допплер, III триместр)
- [ ] **PDF Вудворд** (>20 МБ) — разбить или сжать для сверки
- [x] **PDF1 (Скрининг 11-14)** — без таблиц нормограмм, текстовое пособие

## Открыто (v2 / не блокер пилота)

- [x] Zod на оставшихся API (sign-out, author cover, account delete, pubmed pmid, enroll/complete UUID, admin revoke)
- [ ] Stripe/YooKassa webhooks — подпись провайдера (не Zod body); вне wave
- [ ] Full Playwright CI (сейчас только CPI)
- [ ] Vascular Kulikov mobile parity
- [ ] Duplicate O-RADS mobile `oradsCalculator` → `@repo/orads-us`
- [ ] Structured Reporting (SRE) Phase 1
- [ ] App Store / Google Play release
- [ ] i18n en/es
