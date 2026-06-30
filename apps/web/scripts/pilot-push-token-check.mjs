#!/usr/bin/env node
/**
 * Пилот — проверка push-токенов после установки mobile APK.
 *
 *   node scripts/pilot-push-token-check.mjs
 *   node scripts/pilot-push-token-check.mjs --user=<uuid>
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { mergeWebEnv } from "./lib/seed-course-video.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const env = mergeWebEnv(webRoot);
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const userArg = process.argv.find((a) => a.startsWith("--user="))?.slice(7)?.trim();

let failed = 0;
function ok(msg) {
  console.log(`✓ ${msg}`);
}
function fail(msg, detail) {
  console.log(`✗ ${msg}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

if (!url || !serviceKey) {
  console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("\n🧪 Pilot push token check\n");

  const { count, error } = await admin
    .from("user_push_tokens")
    .select("*", { count: "exact", head: true });
  if (error) fail("user_push_tokens", error.message);
  else if (!count) fail("user_push_tokens", "0 строк — установите APK, войдите, разрешите push");
  else ok(`push tokens total: ${count}`);

  if (userArg) {
    const { data, error: rowErr } = await admin
      .from("user_push_tokens")
      .select("user_id, platform, expo_push_token, updated_at")
      .eq("user_id", userArg);
    if (rowErr) fail(`tokens for ${userArg}`, rowErr.message);
    else if (!data?.length) fail(`tokens for user ${userArg}`, "нет строк");
    else {
      ok(`user ${userArg}: ${data.length} token(s)`);
      for (const row of data) {
        console.log(`  · ${row.platform} ${String(row.expo_push_token).slice(0, 28)}… @ ${row.updated_at}`);
      }
    }
  }

  console.log("\n--- После установки APK ---");
  console.log("1. Войти (Telegram или email)");
  console.log("2. Разрешить уведомления при запросе OS");
  console.log("3. Повторить: npm run pilot:push-check -- --user=<your-uuid>");
  console.log("4. Discussions e2e: npm run pilot:discussions\n");

  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
