#!/usr/bin/env node
/**
 * Archive courses so they disappear from public catalog.
 *
 * Targets:
 *   - FMF Ambassador · плодовые срезы (id 1d67a487-…)
 *   - ОТТЕНКИ 2024 (by title)
 *
 * Usage (apps/web):
 *   node scripts/archive-unwanted-courses.mjs
 *   node scripts/archive-unwanted-courses.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

const COURSE_IDS = ["1d67a487-194c-4cd9-9db3-080b17b1698a"];
const TITLE_PATTERNS = ["%Ambassador%плод%", "%ОТТЕНКИ%2024%", "%ОТТЕНКИ%"];

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

const env = {
  ...loadEnv(path.join(webRoot, ".env.local.save")),
  ...loadEnv(path.join(webRoot, ".env.local")),
  ...process.env,
};

const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findTargets() {
  const byId = new Map();

  if (COURSE_IDS.length) {
    const { data, error } = await admin.from("courses").select("id,title,status").in("id", COURSE_IDS);
    if (error) throw error;
    for (const row of data ?? []) byId.set(row.id, row);
  }

  for (const pattern of TITLE_PATTERNS) {
    const { data, error } = await admin
      .from("courses")
      .select("id,title,status")
      .ilike("title", pattern)
      .limit(20);
    if (error) throw error;
    for (const row of data ?? []) byId.set(row.id, row);
  }

  return [...byId.values()];
}

async function main() {
  console.log("\n🗄  Archive unwanted courses\n");
  const targets = await findTargets();
  if (!targets.length) {
    console.log("Не найдено курсов (уже удалены/архивированы или другие названия).");
    return;
  }

  for (const c of targets) {
    console.log(`• ${c.id} | ${c.status} | ${c.title}`);
  }

  if (dryRun) {
    console.log("\nDry-run — изменений нет. Уберите --dry-run для archive.\n");
    return;
  }

  const ids = targets.map((c) => c.id);
  const { error } = await admin
    .from("courses")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) {
    console.error("✗ update failed:", error.message);
    process.exit(1);
  }

  // Hide related webinar sessions if any.
  const { error: wErr } = await admin
    .from("webinar_sessions")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .in("course_id", ids);
  if (wErr) {
    console.warn("⚠ webinar_sessions:", wErr.message);
  } else {
    console.log("✓ webinar_sessions → cancelled (если были)");
  }

  console.log(`\n✓ ${ids.length} курс(ов) → status=archived\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
