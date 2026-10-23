#!/usr/bin/env node
/**
 * One-shot after SUPABASE_ACCESS_TOKEN is in .env.local.
 * Syncs Edge VAPID secrets and prints prod health rollout flags.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const baseUrl = (process.env.BASE_URL || "https://sonogyn-pro.ru").replace(/\/$/, "");

console.log("\n🔔 Finish Web Push rollout\n");

const setup = spawnSync(
  "node",
  ["scripts/setup-web-push-vapid.mjs", "--apply", "--skip-vercel-cli"],
  { cwd: webRoot, encoding: "utf8", stdio: "inherit" },
);

if (setup.status !== 0) {
  process.exit(setup.status ?? 1);
}

console.log(`\n📡 Health · ${baseUrl}/api/health\n`);

try {
  const res = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(25_000) });
  if (!res.ok) {
    console.warn(`⚠️  HTTP ${res.status} — проверьте вручную позже`);
    process.exit(0);
  }
  const j = await res.json();
  console.log(JSON.stringify({ commit: j.commit, rollout: j.rollout }, null, 2));
  if (j.rollout?.doctorChatV2 !== true) {
    console.warn("\n⚠️  doctorChatV2 не true — см. Vercel Production env");
  }
  if (j.rollout?.doctorChatWebPush !== true) {
    console.warn("⚠️  doctorChatWebPush не true — см. Vercel Production env");
  } else {
    console.log("\n✅ Client flags OK. После Edge secrets — тест push из чата под логином.");
  }
} catch (e) {
  console.warn(`⚠️  Health недоступен с этой машины: ${e.message}`);
  console.log("   Локально: curl -s https://sonogyn-pro.ru/api/health | jq .rollout\n");
}

console.log("\nДальше: npm run test:messenger-v2-smoke (BASE_URL=https://sonogyn-pro.ru)\n");
