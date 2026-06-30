#!/usr/bin/env node
/**
 * Pilot #12 — end-to-end teaching case (R6 gate + lifecycle + feed).
 *
 * Usage (from apps/web):
 *   node scripts/pilot-case-e2e.mjs
 *   node scripts/pilot-case-e2e.mjs --keep   # не удалять pilot-кейс
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { mergeWebEnv } from "./lib/seed-course-video.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const keep = process.argv.includes("--keep");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

const env = mergeWebEnv(webRoot);
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const devEmail = env.DEV_LOGIN_EMAIL?.trim();

let failed = 0;
function ok(msg) {
  console.log(`✅ ${msg}`);
}
function fail(msg, detail) {
  console.log(`❌ ${msg}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

if (!url || !serviceKey || !devEmail) {
  console.error("Нужны NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEV_LOGIN_EMAIL в .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserIdByEmail(targetEmail) {
  const target = targetEmail.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function main() {
  console.log("\n🧪 Pilot case E2E (task #12)\n");

  const userId = await findUserIdByEmail(devEmail);
  if (!userId) {
    fail("Dev user", `не найден: ${devEmail} — запустите npm run setup:dev-login`);
    process.exit(1);
  }
  ok(`Dev user ${devEmail}`);

  const stamp = new Date().toISOString().slice(0, 19);
  const { data: caseRow, error: caseErr } = await admin
    .from("cases")
    .insert({
      user_id: userId,
      title: `Pilot E2E · O-RADS 3 · ${stamp}`,
      description: "Учебный кейс pilot smoke — без PHI. Автотест IA v2.",
      anatomy: "Adnexa",
      pathology: "Cystic mass",
      difficulty: "intermediate",
      status: "draft",
      is_public: false,
      orads_category: 3,
      tags: ["pilot", "o-rads"],
      lifecycle_status: "open",
    })
    .select("id")
    .single();

  if (caseErr || !caseRow?.id) {
    fail("Создание draft-кейса", caseErr?.message);
    process.exit(1);
  }
  const caseId = caseRow.id;
  ok(`Draft case ${caseId.slice(0, 8)}…`);

  const { data: mediaRow, error: mediaErr } = await admin
    .from("case_media")
    .insert({
      case_id: caseId,
      storage_path: `${userId}/${caseId}/pilot-placeholder.jpg`,
      media_type: "image",
      anonymization_status: "pending",
    })
    .select("id")
    .single();

  if (mediaErr || !mediaRow?.id) {
    fail("case_media pending", mediaErr?.message);
    await admin.from("cases").delete().eq("id", caseId);
    process.exit(1);
  }
  ok("Media pending (R6)");

  const blocked = await admin
    .from("cases")
    .update({ status: "published", is_public: true })
    .eq("id", caseId);

  if (blocked.error?.message?.includes("publish blocked")) {
    ok("Server gate R6 заблокировал publish");
  } else if (blocked.error) {
    fail("Publish с pending media", `ожидали R6, получили: ${blocked.error.message}`);
  } else {
    fail("Publish с pending media", "ожидали ошибку триггера, publish прошёл");
  }

  const { error: passErr } = await admin
    .from("case_media")
    .update({
      anonymization_status: "passed",
      anonymization_checked_at: new Date().toISOString(),
      anonymization_checked_by: userId,
    })
    .eq("id", mediaRow.id);

  if (passErr) {
    fail("Подтверждение anonymization", passErr.message);
  } else {
    ok("Media → passed");
  }

  const published = await admin
    .from("cases")
    .update({ status: "published", is_public: true })
    .eq("id", caseId);

  if (published.error) {
    fail("Publish после passed", published.error.message);
  } else {
    ok("Publish после anonymization");
  }

  const { error: editorialErr } = await admin
    .from("cases")
    .update({
      lifecycle_status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: userId,
      is_rare: true,
      rare_slot: "dont_miss",
      editorial_priority: 10,
    })
    .eq("id", caseId);

  if (editorialErr) {
    fail("Editorial + CONFIRMED", editorialErr.message);
  } else {
    ok("Lifecycle CONFIRMED + is_rare (feed)");
  }

  const { count: confirmedCount } = await admin
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("lifecycle_status", "confirmed")
    .eq("status", "published");

  if ((confirmedCount ?? 0) >= 1) {
    ok(`/feed query: confirmed cases = ${confirmedCount}`);
  } else {
    fail("Feed confirmed count", "0");
  }

  if (keep) {
    console.log(`\n📌 Кейс сохранён (--keep): /cases/${caseId}\n`);
  } else {
    await admin.from("case_media").delete().eq("case_id", caseId);
    await admin.from("cases").delete().eq("id", caseId);
    console.log("\n🧹 Pilot-кейс удалён (без --keep)\n");
  }

  if (failed > 0) {
    console.log(`\nИтог: ${failed} ошибок\n`);
    process.exit(1);
  }
  console.log("\n✅ Pilot E2E пройден — можно смотреть в UI с --keep\n");
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
