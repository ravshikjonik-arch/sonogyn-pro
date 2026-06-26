#!/usr/bin/env node
/**
 * Seed 3–5 confirmed teaching cases for /feed editorial blocks.
 *
 * Usage (from apps/web):
 *   npm run feed:editorial-seed
 *   npm run feed:editorial-seed -- --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const dryRun = process.argv.includes("--dry-run");

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

const env = { ...loadEnv(envPath), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const devEmail = env.DEV_LOGIN_EMAIL?.trim();

const SEED_CASES = [
  {
    title: "Feed seed · O-RADS 4 · papillary solid",
    description: "Учебный кейс для ленты — без PHI. Editorial: case of day.",
    anatomy: "Adnexa",
    pathology: "Solid ovarian mass · papillary",
    orads_category: 4,
    tags: ["feed-seed", "o-rads"],
    editorial_priority: 20,
    is_rare: false,
    rare_slot: null,
  },
  {
    title: "Feed seed · TI-RADS 4 · hypoechoic nodule",
    description: "Щитовидная · подозрительный узел — учебный материал.",
    anatomy: "Thyroid",
    pathology: "Hypoechoic nodule",
    tags: ["feed-seed", "ti-rads"],
    editorial_priority: 15,
    is_rare: false,
    rare_slot: null,
  },
  {
    title: "Feed seed · Rare · deep endometriosis nodule",
    description: "Редкая патология для блока «Не пропусти».",
    anatomy: "Pelvis",
    pathology: "Deep infiltrating endometriosis",
    tags: ["feed-seed", "endometriosis"],
    editorial_priority: 12,
    is_rare: true,
    rare_slot: "dont_miss",
  },
  {
    title: "Feed seed · BI-RADS 4A · complex cyst",
    description: "МЖ · сложная киста — учебный кейс.",
    anatomy: "Breast",
    pathology: "Complex cystic mass",
    tags: ["feed-seed", "bi-rads"],
    editorial_priority: 10,
    is_rare: false,
    rare_slot: null,
  },
  {
    title: "Feed seed · Cervix · CIN2 colposcopy",
    description: "Шейка · CIN2 — для CPI / colposcopy track.",
    anatomy: "Cervix",
    pathology: "CIN2",
    tags: ["feed-seed", "cervix"],
    editorial_priority: 8,
    is_rare: false,
    rare_slot: null,
  },
];

async function findUserIdByEmail(admin, targetEmail) {
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

async function seedOne(admin, userId, spec, index) {
  const stamp = new Date().toISOString().slice(0, 19);
  const { data: caseRow, error: caseErr } = await admin
    .from("cases")
    .insert({
      user_id: userId,
      title: `${spec.title} · ${stamp}`,
      description: spec.description,
      anatomy: spec.anatomy,
      pathology: spec.pathology,
      difficulty: "intermediate",
      status: "draft",
      is_public: false,
      orads_category: spec.orads_category ?? null,
      tags: spec.tags,
      lifecycle_status: "open",
    })
    .select("id")
    .single();

  if (caseErr || !caseRow?.id) throw new Error(caseErr?.message ?? "case insert failed");
  const caseId = caseRow.id;

  const { data: mediaRow, error: mediaErr } = await admin
    .from("case_media")
    .insert({
      case_id: caseId,
      storage_path: `${userId}/${caseId}/feed-seed-${index}.jpg`,
      media_type: "image",
      anonymization_status: "passed",
      anonymization_checked_at: new Date().toISOString(),
      anonymization_checked_by: userId,
    })
    .select("id")
    .single();

  if (mediaErr) {
    await admin.from("cases").delete().eq("id", caseId);
    throw new Error(mediaErr.message);
  }

  const { error: pubErr } = await admin
    .from("cases")
    .update({ status: "published", is_public: true })
    .eq("id", caseId);
  if (pubErr) throw new Error(pubErr.message);

  const { error: editorialErr } = await admin
    .from("cases")
    .update({
      lifecycle_status: "confirmed",
      confirmed_at: new Date().toISOString(),
      confirmed_by: userId,
      is_rare: spec.is_rare,
      rare_slot: spec.rare_slot,
      editorial_priority: spec.editorial_priority,
    })
    .eq("id", caseId);

  if (editorialErr) throw new Error(editorialErr.message);

  return { caseId, mediaId: mediaRow.id, title: spec.title };
}

async function main() {
  console.log("\n🌱 Feed editorial seed\n");

  if (!url || !serviceKey || !devEmail) {
    console.error("Нужны NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEV_LOGIN_EMAIL");
    process.exit(1);
  }

  if (dryRun) {
    console.log(`Dry-run: создали бы ${SEED_CASES.length} confirmed кейсов для ${devEmail}\n`);
    SEED_CASES.forEach((c, i) => console.log(`  ${i + 1}. ${c.title} (priority ${c.editorial_priority})`));
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const userId = await findUserIdByEmail(admin, devEmail);
  if (!userId) {
    console.error(`Dev user не найден: ${devEmail}`);
    process.exit(1);
  }
  console.log(`✅ Dev user ${devEmail}`);

  const created = [];
  for (let i = 0; i < SEED_CASES.length; i++) {
    try {
      const row = await seedOne(admin, userId, SEED_CASES[i], i + 1);
      created.push(row);
      console.log(`✅ ${row.title} → /cases/${row.caseId}`);
    } catch (err) {
      console.log(`❌ ${SEED_CASES[i].title} — ${err.message}`);
    }
  }

  const { count } = await admin
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("lifecycle_status", "confirmed")
    .eq("status", "published");

  console.log(`\n📊 Confirmed published cases: ${count ?? 0}`);
  console.log(`📌 Создано в этом прогоне: ${created.length}\n`);
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
