# SECURITY_AUDIT — SonoGyn Pro

**Дата:** 2026-11-05  
**Объём:** этапы 0–7 (код в репо). Prod SQL apply / ротация ключей — вручную (см. чек-лист).

## Резюме

| Область | Статус |
|---------|--------|
| Утечки секретов в git | Не найдено live `sk_live` / `whsec_` / private keys |
| Client bundle secrets | Секреты не в `"use client"`; Telegram token отделён |
| RLS / PHI | EMR own-row; profiles self; новая миграция hardening |
| Stripe webhook | Signature + idempotency claim |
| Rate limit / anti-abuse | Upstash + bot UA + Turnstile на login/reset |
| Headers / CORS / cookies | Уже сильные; `poweredByHeader: false` |
| XSS | DOMPurify на курсах/кейсах; myoma sanitize; markdown escape |
| Dependabot | Уже есть `.github/dependabot.yml` |

## Найденное → исправлено в коде

| ID | Severity | Что | Фикс |
|----|----------|-----|------|
| S1-01 | Med | Telegram token в том же модуле, что username | `telegram-bot-public.ts` + server config |
| S1-02 | Low | Fake-looking token в TELEGRAM_SETUP.md | Placeholder `REPLACE_WITH_…` |
| S1-03 | Low | `.gitignore` env dumps | Расширен root `.gitignore` |
| S2-01 | High | Risk of profiles `USING (true)` regress | Миграция `20261105080000_…` re-assert self |
| S2-02 | High | PHI buckets public? | Migration force `public=false` |
| S2-03 | Med | Audit RPC category forgery | Allowlist categories |
| S2-04 | Med | Stripe duplicate webhooks | `stripe_webhook_events` + Upstash NX |
| S3-01 | High | Stripe error leak | Generic `Invalid signature` |
| S4-01 | Med | Forgot-password без CAPTCHA | Turnstile + wizard UI |
| S4-02 | Med | Auth fail lockout soft | Default 10 fails / 15 min |
| S5-01 | Low | X-Powered-By | `poweredByHeader: false` |
| S6-01 | Med | Myoma HTML inject | `sanitizeCourseHtml` |

Новые helpers: `with-rate-limit.ts`, `safe-api-error.ts`, `webhook-idempotency.ts`.

## Уже было до аудита (не ломали)

- Upstash sliding-window RL (`rate-limit.ts`, fail-closed prod)
- Bot UA block на `/api/*`
- Stripe `constructEvent(rawBody)`
- CORS whitelist (no `*`)
- Cookies httpOnly / secure / sameSite=lax
- Turnstile на sign-in / sign-up (частично)
- Phase A profiles + DEFINER revoke (applied prod earlier)
- CSP / HSTS / XFO / Permissions-Policy в `next.config.ts`
- Open-redirect helper `safeInternalPath`

## Требует ручных действий (вне кода)

| # | Действие | Зачем |
|---|----------|--------|
| 1 | ~~Применить SQL `20261105080000…`~~ **DONE 2026-11-05** MCP name `security_rls_ddos_hardening` on `Sonogyn-Pro` | RLS + stripe_webhook_events |
| 2 | Если когда-либо светили ключи в чатах/скринах — **ротация**: `SUPABASE_SERVICE_ROLE_KEY`, Stripe secret/webhook, Telegram bot, LiveKit, OpenRouter | S1 ops |
| 3 | Vercel: `NEXT_PUBLIC_OPEN_ACCESS_FULL=false` на Production | AI cost / abuse |
| 4 | Vercel Attack Challenge / Firewall при росте трафика | Volumetric DDoS (платформа) |
| 5 | Supabase Auth: HIBP leaked passwords (нужен Pro план) | Слабые пароли |
| 6 | Edge Functions `verify_jwt` / shared secrets review | A7 checklist |
| 7 | **Turnstile keys missing on Vercel** — add `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | CAPTCHA gate |

**Ротация:** не вставлять значения в git/чат — только Dashboard / Vercel Env.

## Чек-лист владельца

- [ ] Apply migration `20261105080000_security_rls_ddos_hardening`
- [ ] User A cannot `select * from profiles where id = B`
- [ ] Replay Stripe test webhook → `duplicate: true` / no double PRO
- [ ] Forgot password with Turnstile (keys on) works
- [ ] `GET /api/health` green (Upstash + SRK)
- [ ] `pnpm --filter @repo/web test:security`
- [ ] `pnpm --filter @repo/web test:e2e:security` (opt)
- [ ] No `AUTH_RATE_LIMIT_RELAXED` / `DEV_SKIP_AUTH` on prod

## Ограничения этого прогона

- Не меняли бизнес-логику калькуляторов / open-access product default в коде.
- Auth IP «5/min» из брифа **не** форсили жёстко (сломало бы login UX); используются env-tunable `RL.*` + tighter fail-hard.
- CSP nonce (убрать `unsafe-inline` script) — отдельный epic (PWA/theme boot).
- Full `npm run build` на этой машине может требовать полный `pnpm install`; unit security tests — green (см. сессию).
- `pnpm audit --prod` OOM на локальной машине (огромный lockfile) — гонять в CI / `NODE_OPTIONS=--max-old-space-size=8192 pnpm audit`; Dependabot уже подключён.

## Файлы

- `apps/web/supabase/migrations/20261105080000_security_rls_ddos_hardening.sql`
- `packages/database/supabase/migrations/20261105080000_security_rls_ddos_hardening.sql` (mirror)
- `docs/security/phase-a-ops-checklist.md` (предыдущий Phase A)
- `docs/enterprise-audit/04_SECURITY_AUDIT.md` (enterprise baseline)
