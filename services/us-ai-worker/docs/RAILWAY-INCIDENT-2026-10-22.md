# Railway incident (Oct 2026) — чеклист SonoGyn

## Уже сделано автоматически

- Новый `US_AI_WORKER_SECRET` → **Vercel** (production + preview), комментарий `Rotated 2026-10-22 Railway incident`.
- Локальный файл (не в git): `.tmp/railway-rotation-2026-10-22.txt` — **тот же секрет** для Railway.

## Сделать вручную (≈15 мин)

1. **Railway** → проект `us-ai-worker` → **Variables**  
   - `US_AI_WORKER_SECRET` = значение из `.tmp/railway-rotation-2026-10-22.txt`  
   - **Redeploy** сервиса (когда builds снова доступны на status.railway.com).

2. **OpenRouter** → [openrouter.ai/keys](https://openrouter.ai/keys)  
   - **Revoke** старый ключ → создать новый.  
   - Обновить `OPENROUTER_API_KEY` на **Railway** и **Vercel** (production + preview, upsert).

3. **Railway token (GitHub CI)**  
   - Railway → Account → Tokens → revoke старый → новый token.  
   - GitHub → `ravshikjonik-arch/sonogyn-pro` → Secrets → `RAILWAY_TOKEN`.

4. **Vercel** — Redeploy Production (после смены секретов), если не сработал auto-deploy.

5. **Smoke**  
   ```bash
   curl -s https://sonogyn-us-ai-production.up.railway.app/health
   ```  
   PRO-кейс на sonogyn-pro.ru → анализ без 401.

## Не ротировать без необходимости

Supabase / Stripe / Vercel-only ключи — только если они **дублировались** в Railway Variables.

## После инцидента — масштаб

См. [docs/architecture/US-AI-SCALE-100-1000.md](../../../docs/architecture/US-AI-SCALE-100-1000.md) (Phase 0 сейчас, очередь при росте).
