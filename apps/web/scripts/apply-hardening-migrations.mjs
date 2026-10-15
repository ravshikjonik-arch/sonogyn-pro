#!/usr/bin/env node
/**
 * Applies only 20260910 hardening migrations (staging/prod via SUPABASE_DB_URL).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const migrationsDir = path.join(webRoot, "supabase", "migrations");
const envPath = path.join(webRoot, ".env.local");

/** v3 often already on prod; incremental hardening is enough for most envs. */
const BATCH_FULL = [
  "20260830170000_case_discussions_v3.sql",
  "20260910180000_case_lifecycle_hardening.sql",
  "20260910190000_protocol_lifecycle_hardening.sql",
  "20260910200000_security_audit_insert_fix.sql",
];

const BATCH_INCREMENTAL = [
  "20260910180000_case_lifecycle_hardening.sql",
  "20260910190000_protocol_lifecycle_hardening.sql",
  "20260910200000_security_audit_insert_fix.sql",
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

function writeBundle(outPath, files, title) {
  const parts = [
    `-- ${title}`,
    "-- Supabase SQL Editor → Run (project from: npm run db:project)",
    `-- Generated: ${new Date().toISOString()}`,
    "",
  ];
  for (const file of files) {
    parts.push(`-- ========== ${file} ==========`);
    parts.push(fs.readFileSync(path.join(migrationsDir, file), "utf8").trim());
    parts.push("");
  }
  fs.writeFileSync(outPath, parts.join("\n"), "utf8");
  console.log(`📄 ${outPath}`);
}

const bundleFull = path.join(webRoot, "supabase", "BUNDLE_HARDENING_20260910.sql");
const bundleIncremental = path.join(webRoot, "supabase", "BUNDLE_HARDENING_INCREMENTAL.sql");
writeBundle(bundleFull, BATCH_FULL, "SonoGyn Pro · hardening full batch");
writeBundle(
  bundleIncremental,
  BATCH_INCREMENTAL,
  "SonoGyn Pro · hardening INCREMENTAL (v3 already applied)",
);

const url = loadEnv(envPath).NEXT_PUBLIC_SUPABASE_URL ?? "";
const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "?";
console.log(`\n🔗 Dashboard: https://supabase.com/dashboard/project/${ref}/sql/new\n`);

let BATCH = BATCH_INCREMENTAL;

const env = loadEnv(envPath);
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL;

if (!dbUrl) {
  console.log(`
⚠️  SUPABASE_DB_URL не задан в apps/web/.env.local

Добавьте connection string (Supabase → Settings → Database → URI):
  SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@...

Затем снова:
  node scripts/apply-hardening-migrations.mjs

Или вставьте ${bundleIncremental} в SQL Editor (npm run db:project — ссылка).
`);
  process.exit(0);
}

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

const { rows } = await client.query("select filename from public.schema_migrations");
const done = new Set(rows.map((r) => r.filename));

for (const file of BATCH) {
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
    await client.end();
    process.exit(1);
  }
}

await client.end();
console.log("\n✅ Hardening migrations applied.\n");
