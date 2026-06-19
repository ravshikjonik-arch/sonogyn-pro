#!/usr/bin/env node
/**
 * One-shot: создать US_AI_WORKER_SECRET и вывести чеклист Railway + Vercel.
 * Usage: node scripts/setup-production.mjs
 */
import { randomBytes } from "crypto";

const secret = randomBytes(32).toString("hex");

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  SonoGyn US AI Worker — Production setup                     ║
╚══════════════════════════════════════════════════════════════╝

1) Сгенерированный секрет (скопируйте в оба места):

   US_AI_WORKER_SECRET=${secret}

2) Railway (https://railway.app/new)

   • New Project → Deploy from GitHub repo
   • Settings → Root Directory: services/us-ai-worker
   • Variables:
       US_AI_WORKER_SECRET=${secret}
       OPENROUTER_API_KEY=sk-or-...
       US_VISION_MODEL=openai/gpt-4o-mini
       US_VISION_BACKEND=openrouter
   • Deploy → скопируйте Public URL (например https://xxx.up.railway.app)

3) Vercel (Production env)

   US_AI_WORKER_URL=https://YOUR-RAILWAY-URL.up.railway.app
   US_AI_WORKER_SECRET=${secret}
   OPENROUTER_US_VISION_MODEL=openai/gpt-4o-mini

   Или: cd apps/web && node scripts/sync-vercel-env.mjs
        (добавьте ключи в .env.local заранее)

4) Smoke test

   curl -s https://YOUR-RAILWAY-URL.up.railway.app/health | jq
   curl -s -X POST https://YOUR-RAILWAY-URL/health ...

5) GitHub Actions (опционально)

   Secret RAILWAY_TOKEN → auto-deploy on push to main
   Secret RAILWAY_SERVICE_ID → ID сервиса us-ai-worker

Подробнее: services/us-ai-worker/docs/DEPLOYMENT.md
`);
