#!/usr/bin/env node
/**
 * R5 legacy media audit (read-only via REST; apply bundle via Postgres/Management API).
 *
 * Usage (from apps/web):
 *   npm run db:legacy-media-audit
 *   node scripts/legacy-media-audit-r5.mjs --apply-bundle
 *
 * Waive after manual PHI review — only via SQL Editor / moderator RPC:
 *   select * from public.waive_legacy_case_media();
 *   select * from public.waive_legacy_case_media('2026-07-01'::timestamptz, false);
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const sqlPath = path.join(__dirname, "..", "supabase", "BUNDLE_LEGACY_MEDIA_R5.sql");
const applyBundle = process.argv.includes("--apply-bundle");
const IA_V2_CUTOFF = "2026-07-01T00:00:00.000Z";

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

function projectRef(url) {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return "";
  }
}

const env = { ...process.env, ...loadEnv(envPath) };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL || env.DIRECT_URL;
const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();
const ref = projectRef(url ?? "");

async function viaPg(sql) {
  const pg = await import("pg").catch(() => null);
  if (!pg?.default?.Client) {
    throw new Error("Установите pg: cd apps/web && npm install pg --save-dev");
  }
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(sql);
  await client.end();
}

async function viaManagementApi(token, projectRefId, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRefId}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${body.message ?? JSON.stringify(body)}`);
  }
  return body;
}

async function applySqlBundle() {
  const sql = fs.readFileSync(sqlPath, "utf8");
  if (dbUrl) {
    console.log("Postgres → apply BUNDLE_LEGACY_MEDIA_R5.sql");
    await viaPg(sql);
    return;
  }
  if (accessToken && ref) {
    console.log(`Management API → project ${ref}`);
    await viaManagementApi(accessToken, ref, sql);
    return;
  }
  console.log(`
Нет SUPABASE_DB_URL / SUPABASE_ACCESS_TOKEN — примените вручную:
  apps/web/supabase/BUNDLE_LEGACY_MEDIA_R5.sql
`);
  process.exit(1);
}

async function auditViaRest() {
  if (!url || !serviceKey) {
    console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local");
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("\n📋 R5 legacy media audit (REST)\n");

  const { data: mediaRows, error: mediaErr } = await admin
    .from("case_media")
    .select("id,case_id,anonymization_status,uploaded_at");

  if (mediaErr) {
    console.error("case_media:", mediaErr.message);
    process.exit(1);
  }

  const byStatus = new Map();
  for (const row of mediaRows ?? []) {
    const key = row.anonymization_status ?? "null";
    byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
  }

  console.log("1) По anonymization_status:");
  for (const [status, cnt] of [...byStatus.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(`   ${status}: ${cnt}`);
  }

  const pendingLegacy = (mediaRows ?? []).filter(
    (r) =>
      r.anonymization_status === "pending" &&
      r.uploaded_at &&
      r.uploaded_at < IA_V2_CUTOFF,
  );

  console.log(`\n2) Legacy pending (uploaded_at < ${IA_V2_CUTOFF}): ${pendingLegacy.length}`);

  const caseIds = [...new Set((mediaRows ?? []).map((r) => r.case_id).filter(Boolean))];
  const publishedPublic = new Set();
  const chunk = 80;
  for (let i = 0; i < caseIds.length; i += chunk) {
    const slice = caseIds.slice(i, i + chunk);
    const { data: cases, error: casesErr } = await admin
      .from("cases")
      .select("id,title,status,is_public")
      .in("id", slice);
    if (casesErr) {
      console.error("cases:", casesErr.message);
      process.exit(1);
    }
    for (const c of cases ?? []) {
      if (c.status === "published" && c.is_public) publishedPublic.add(c.id);
    }
  }

  const blockedByCase = new Map();
  for (const row of mediaRows ?? []) {
    if (!publishedPublic.has(row.case_id)) continue;
    if (row.anonymization_status === "passed" || row.anonymization_status === "waived") continue;
    blockedByCase.set(row.case_id, (blockedByCase.get(row.case_id) ?? 0) + 1);
  }

  console.log(`\n3) Published public cases с blocked media (R6): ${blockedByCase.size}`);
  if (blockedByCase.size > 0) {
    for (const [caseId, cnt] of [...blockedByCase.entries()].slice(0, 10)) {
      console.log(`   ${caseId}: ${cnt} файл(ов)`);
    }
    if (blockedByCase.size > 10) console.log(`   … ещё ${blockedByCase.size - 10}`);
  }

  const legacyPublished = pendingLegacy.filter((r) => publishedPublic.has(r.case_id));
  console.log(`\n4) Legacy waive candidates (pending + pre-cutoff + published): ${legacyPublished.length}`);

  console.log(`
Следующий шаг (после ручной PHI-проверки):
  1) SQL Editor → BUNDLE_LEGACY_MEDIA_R5.sql (RPC waive_legacy_case_media)
  2) Dry-run: select * from public.waive_legacy_case_media();
  3) Apply:   select * from public.waive_legacy_case_media('2026-07-01'::timestamptz, false);
`);
}

console.log("\n🔍 legacy-media-audit-r5\n");

try {
  if (applyBundle) {
    await applySqlBundle();
    console.log("✓ BUNDLE_LEGACY_MEDIA_R5 applied\n");
  }
  await auditViaRest();
} catch (err) {
  console.error("✗", err.message ?? err);
  process.exit(1);
}
