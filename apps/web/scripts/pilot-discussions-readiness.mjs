#!/usr/bin/env node
/**
 * Pilot — готовность Discussions e2e (инфра + чеклист).
 * Проверяет Supabase таблицы/каналы; push/deep link — вручную на устройстве.
 *
 *   node scripts/pilot-discussions-readiness.mjs
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

async function tableOk(name, select = "id") {
  const { error } = await admin.from(name).select(select).limit(1);
  if (error) {
    fail(`table ${name}`, error.message);
    return false;
  }
  ok(`table ${name}`);
  return true;
}

async function main() {
  console.log("\n🧪 Pilot Discussions readiness\n");

  await tableOk("cases");
  await tableOk("teaching_case_comments");
  await tableOk("doctor_chat_channels");
  await tableOk("channel_subscriptions", "user_id");
  await tableOk("case_subscriptions", "user_id");
  await tableOk("user_push_tokens", "user_id");

  const { data: channels, error: chErr } = await admin
    .from("doctor_chat_channels")
    .select("id, title, slug")
    .limit(5);
  if (chErr) fail("doctor_chat_channels list", chErr.message);
  else if (!channels?.length) fail("doctor_chat_channels", "нет каналов — seed discussions");
  else ok(`channels: ${channels.map((c) => c.slug ?? c.title).join(", ")}`);

  const { count, error: tokErr } = await admin
    .from("user_push_tokens")
    .select("*", { count: "exact", head: true });
  if (tokErr) fail("user_push_tokens count", tokErr.message);
  else if (!count) fail("user_push_tokens", "0 строк — нужен EAS build + login на mobile");
  else ok(`push tokens registered: ${count}`);

  console.log("\n--- Ручной e2e (TODO.md) ---");
  console.log("1. Web: /cases → feed «Обсуждения» → новый вопрос в канале");
  console.log("2. Другой аккаунт (mobile): ответ на кейс");
  console.log("3. Mobile: push «Новый ответ» → tap → deep link в кейс");
  console.log("4. Supabase: teaching_case_comments + notify-new-comment edge function\n");

  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
