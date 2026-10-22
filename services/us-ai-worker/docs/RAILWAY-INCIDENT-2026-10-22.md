# Railway incident (Oct 2026) — чеклист SonoGyn

## Уже сделано автоматически

- Новый `US_AI_WORKER_SECRET` → **Vercel** (production + preview), комментарий `Rotated 2026-10-22 Railway incident`.
- Локальный файл (не в git): `.tmp/railway-rotation-2026-10-22.txt` — **тот же секрет** для Railway.

## Prod сейчас — Fly (Railway не обязателен)

- Worker: **https://sonogyn-us-ai.fly.dev**
- Vercel + GitHub Fly CI — настроены (см. [INCIDENT-RESOLUTION-2026-10-22.md](./INCIDENT-RESOLUTION-2026-10-22.md))

## Осталось по гигиене (≈10 мин, вручную)

1. **OpenRouter** → [openrouter.ai/keys](https://openrouter.ai/keys) — **revoke** ключи, выданные до инцидента (текущий ключ уже на Vercel + Fly).

2. **Railway** — только если снова платите Hobby: Variables + redeploy; иначе проект можно не трогать.

3. **GitHub `RAILWAY_TOKEN`** — нужен лишь для job `deploy-railway` в `us-ai-worker.yml`; при Fly-only можно не обновлять.

4. **Smoke PRO в UI** — кейс с JPEG и (если есть) DICOM → «Запустить (PRO)» без 401.

5. **Авто-smoke с Mac:**
   ```bash
   node apps/web/scripts/check-production-smoke.mjs
   ```

## Не ротировать без необходимости

Supabase / Stripe / Vercel-only ключи — только если они **дублировались** в Railway Variables.

## После инцидента — масштаб

См. [docs/architecture/US-AI-SCALE-100-1000.md](../../../docs/architecture/US-AI-SCALE-100-1000.md) (Phase 0 сейчас, очередь при росте).
