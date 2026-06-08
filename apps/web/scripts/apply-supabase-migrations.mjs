#!/usr/bin/env node
/**
 * Применяет SQL-миграции из apps/web/supabase/migrations/
 *
 * Вариант A — прямое подключение Postgres (рекомендуется):
 *   Supabase Dashboard → Settings → Database → Connection string (URI)
 *   Добавьте в apps/web/.env.local:
 *     SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@...
 *   Затем: node scripts/apply-supabase-migrations.mjs
 *
 * Вариант B — без пароля БД:
 *   node scripts/apply-supabase-migrations.mjs --bundle-only
 *   Откройте supabase/BUNDLE_FOR_SQL_EDITOR.sql в SQL Editor и Run.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const migrationsDir = path.join(webRoot, "supabase", "migrations");
const envPath = path.join(webRoot, ".env.local");
const bundlePath = path.join(webRoot, "supabase", "BUNDLE_FOR_SQL_EDITOR.sql");
const communityBundlePath = path.join(webRoot, "supabase", "BUNDLE_COMMUNITY_CHAT_ONLY.sql");
const COMMUNITY_ONLY = [
  "20260605120000_teaching_case_media_storage.sql",
  "20260605130000_doctor_chat.sql",
  "20260605140000_community_realtime.sql",
  "20260605200000_doctor_presence.sql",
];

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function listMigrations() {
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

function buildBundle(files) {
  const parts = [
    "-- SonoGyn Pro · все миграции (порядок по имени файла)",
    "-- Supabase Dashboard → SQL Editor → вставить и Run",
    `-- Сгенерировано: ${new Date().toISOString()}`,
    "",
  ];
  for (const file of files) {
    parts.push(`-- ========== ${file} ==========`);
    parts.push(fs.readFileSync(path.join(migrationsDir, file), "utf8").trim());
    parts.push("");
  }
  return parts.join("\n");
}

async function applyWithPg(dbUrl, files) {
  const pg = await import("pg").catch(() => null);
  if (!pg?.default?.Client) {
    console.error("Установите pg: cd apps/web && npm install pg --save-dev");
    process.exit(1);
  }

  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const { rows: applied } = await client.query("select filename from public.schema_migrations");
  const done = new Set(applied.map((r) => r.filename));

  for (const file of files) {
    if (done.has(file)) {
      console.log(`⏭  уже применена: ${file}`);
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`▶  ${file}`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query("insert into public.schema_migrations (filename) values ($1)", [file]);
      await client.query("commit");
      console.log(`✓  ${file}`);
    } catch (err) {
      await client.query("rollback");
      console.error(`✗  ${file}:`, err.message);
      throw err;
    }
  }

  await client.end();
}

const bundleOnly = process.argv.includes("--bundle-only");
const files = listMigrations();
const bundle = buildBundle(files);
fs.writeFileSync(bundlePath, bundle, "utf8");
const communityFiles = files.filter((f) => COMMUNITY_ONLY.includes(f));
fs.writeFileSync(communityBundlePath, buildBundle(communityFiles), "utf8");
console.log(`📄 Полный bundle: ${bundlePath} (${files.length} файлов)`);
console.log(`📄 Только чат: ${communityBundlePath} (${communityFiles.length} файлов)`);

if (bundleOnly) {
  console.log("\nSQL Editor → Run:");
  console.log("  • BUNDLE_COMMUNITY_CHAT_ONLY.sql — если база уже была");
  console.log("  • BUNDLE_FOR_SQL_EDITOR.sql — полная установка");
  process.exit(0);
}

const env = loadEnv(envPath);
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;

if (!dbUrl) {
  console.log(`
Нет SUPABASE_DB_URL в .env.local — автоматическое применение пропущено.

1) Скопируйте connection string из Supabase (Settings → Database)
2) Добавьте в apps/web/.env.local:
   SUPABASE_DB_URL=postgresql://...
3) npm install pg --save-dev  (в apps/web)
4) node scripts/apply-supabase-migrations.mjs

Или сейчас: SQL Editor → вставьте supabase/BUNDLE_FOR_SQL_EDITOR.sql → Run
`);
  process.exit(0);
}

try {
  await applyWithPg(dbUrl, files);
  console.log("\n✅ Все миграции применены.");
} catch {
  process.exit(1);
}
