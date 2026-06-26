#!/usr/bin/env node
/**
 * Поддержка editorial-кейсов для /feed: очистка автотестов + аккуратный seed.
 *
 * Usage (from apps/web):
 *   npm run feed:editorial-maintain          # clean + seed
 *   npm run feed:editorial-maintain -- --clean-only
 *   npm run feed:editorial-maintain -- --seed-only
 *   npm run feed:editorial-maintain -- --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const cleanOnly = args.has("--clean-only");
const seedOnly = args.has("--seed-only");
const doClean = !seedOnly;
const doSeed = !cleanOnly;

/** Клинические заголовки для prod-ленты (без «Feed seed», без ISO в title). */
const EDITORIAL_CASES = [
  {
    title: "O-RADS 4 · солидное образование с папиллярными разрастаниями",
    description: "Учебный кейс яичника · без PHI. Для блока Case of the day.",
    anatomy: "Adnexa",
    pathology: "Solid ovarian mass · papillary",
    orads_category: 4,
    tags: ["editorial", "o-rads"],
    editorial_priority: 20,
    is_rare: false,
    rare_slot: null,
  },
  {
    title: "TI-RADS 4 · гипоэхогенный узел щитовидной железы",
    description: "Подозрительный узел ЩЖ · учебный материал для ленты.",
    anatomy: "Thyroid",
    pathology: "Hypoechoic nodule",
    tags: ["editorial", "ti-rads"],
    editorial_priority: 15,
    is_rare: false,
    rare_slot: null,
  },
  {
    title: "Глубокий эндометриоз · узел в крестцово-маточной связке",
    description: "Редкая патология · блок «Не пропусти».",
    anatomy: "Pelvis",
    pathology: "Deep infiltrating endometriosis",
    tags: ["editorial", "endometriosis"],
    editorial_priority: 12,
    is_rare: true,
    rare_slot: "dont_miss",
  },
  {
    title: "BI-RADS 4A · сложная киста молочной железы",
    description: "Учебный кейс МЖ · без идентифицирующих данных.",
    anatomy: "Breast",
    pathology: "Complex cystic mass",
    tags: ["editorial", "bi-rads"],
    editorial_priority: 10,
    is_rare: false,
    rare_slot: null,
  },
  {
    title: "CIN 2 · кольпоскопическая картина шейки матки",
    description: "Патология шейки · для CPI / colposcopy track.",
    anatomy: "Cervix",
    pathology: "CIN2",
    tags: ["editorial", "cervix"],
    editorial_priority: 8,
    is_rare: false,
    rare_slot: null,
  },
];

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

function isTestCase(row) {
  const tags = Array.isArray(row.tags) ? row.tags : [];
  if (tags.includes("pilot") || tags.includes("feed-seed")) return true;
  const title = (row.title ?? "").toLowerCase();
  if (title.includes("pilot e2e") || title.startsWith("feed seed")) return true;
  return false;
}

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

async function cleanTestCases(admin) {
  const { data: rows, error } = await admin
    .from("cases")
    .select("id,title,tags,lifecycle_status");

  if (error) throw new Error(error.message);

  const toDelete = (rows ?? []).filter(isTestCase);
  if (toDelete.length === 0) {
    console.log("🧹 Тестовых кейсов не найдено");
    return 0;
  }

  console.log(`🧹 Удаление ${toDelete.length} тестовых кейсов…`);
  for (const row of toDelete) {
    console.log(`   · ${row.title?.slice(0, 60) ?? row.id}`);
    if (dryRun) continue;
    await admin.from("case_media").delete().eq("case_id", row.id);
    await admin.from("teaching_case_comments").delete().eq("case_id", row.id);
    await admin.from("teaching_case_likes").delete().eq("case_id", row.id);
    await admin.from("teaching_case_bookmarks").delete().eq("case_id", row.id);
    const { error: delErr } = await admin.from("cases").delete().eq("id", row.id);
    if (delErr) console.log(`   ⚠️  ${row.id}: ${delErr.message}`);
  }
  return toDelete.length;
}

async function seedOne(admin, userId, spec) {
  const { data: existing } = await admin
    .from("cases")
    .select("id,title")
    .contains("tags", ["editorial"])
    .eq("anatomy", spec.anatomy)
    .eq("lifecycle_status", "confirmed")
    .limit(1);

  if (existing?.length) {
    console.log(`⏭️  Уже есть editorial · ${spec.anatomy}: ${existing[0].title}`);
    return null;
  }

  const { data: caseRow, error: caseErr } = await admin
    .from("cases")
    .insert({
      user_id: userId,
      title: spec.title,
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

  const { error: mediaErr } = await admin.from("case_media").insert({
    case_id: caseId,
    storage_path: `${userId}/${caseId}/editorial-placeholder.jpg`,
    media_type: "image",
    anonymization_status: "passed",
    anonymization_checked_at: new Date().toISOString(),
    anonymization_checked_by: userId,
  });

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

  return { caseId, title: spec.title };
}

async function main() {
  console.log("\n📋 Feed editorial maintain\n");

  const env = { ...loadEnv(envPath), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const devEmail = env.DEV_LOGIN_EMAIL?.trim();

  if (!url || !serviceKey || !devEmail) {
    console.error("Нужны NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEV_LOGIN_EMAIL");
    process.exit(1);
  }

  if (dryRun) {
    console.log(`Dry-run: clean=${doClean} seed=${doSeed}`);
    console.log(`  Удалили бы кейсы с tags pilot/feed-seed или title Pilot E2E/Feed seed`);
    console.log(`  Создали бы до ${EDITORIAL_CASES.length} editorial-кейсов (idempotent по anatomy)\n`);
    EDITORIAL_CASES.forEach((c, i) => console.log(`  ${i + 1}. ${c.title}`));
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (doClean) {
    const removed = await cleanTestCases(admin);
    console.log(`✅ Очищено: ${removed}\n`);
  }

  if (doSeed) {
    const userId = await findUserIdByEmail(admin, devEmail);
    if (!userId) {
      console.error(`Dev user не найден: ${devEmail}`);
      process.exit(1);
    }
    console.log(`✅ Dev user ${devEmail}\n`);

    let created = 0;
    for (const spec of EDITORIAL_CASES) {
      try {
        const row = await seedOne(admin, userId, spec);
        if (row) {
          created += 1;
          console.log(`✅ ${row.title}`);
          console.log(`   → /cases/${row.caseId}`);
        }
      } catch (err) {
        console.log(`❌ ${spec.title} — ${err.message}`);
      }
    }

    const { count } = await admin
      .from("cases")
      .select("id", { count: "exact", head: true })
      .eq("lifecycle_status", "confirmed")
      .eq("status", "published");

    console.log(`\n📊 Confirmed published: ${count ?? 0} · создано сейчас: ${created}\n`);
  }
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
