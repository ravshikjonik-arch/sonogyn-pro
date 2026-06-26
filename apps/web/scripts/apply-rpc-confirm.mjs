#!/usr/bin/env node
/**
 * Применяет confirm_teaching_case RPC + reload PostgREST schema.
 *
 * Вариант A — SUPABASE_DB_URL в .env.local (Settings → Database → URI)
 *   node scripts/apply-rpc-confirm.mjs
 *
 * Вариант B — SUPABASE_ACCESS_TOKEN (Account → Access Tokens)
 *   node scripts/apply-rpc-confirm.mjs --management-api
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const sqlPath = path.join(__dirname, "..", "supabase", "BUNDLE_RPC_CONFIRM.sql");

const useManagement = process.argv.includes("--management-api");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
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

const SQL = fs.readFileSync(sqlPath, "utf8");

async function viaPg(dbUrl) {
  const pg = await import("pg").catch(() => null);
  if (!pg?.default?.Client) {
    console.error("Установите pg: cd apps/web && npm install pg --save-dev");
    process.exit(1);
  }
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(SQL);
  await client.end();
}

async function viaManagementApi(token, ref) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: SQL }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${body.message ?? JSON.stringify(body)}`);
  }
  return body;
}

const env = { ...process.env, ...loadEnv(envPath) };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const ref = projectRef(supabaseUrl ?? "");
const dbUrl = env.SUPABASE_DB_URL || env.DATABASE_URL || env.DIRECT_URL;
const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();

console.log("\n🔧 apply-rpc-confirm\n");

try {
  if (useManagement || (!dbUrl && accessToken)) {
    if (!accessToken || !ref) {
      console.error("Нужны SUPABASE_ACCESS_TOKEN и NEXT_PUBLIC_SUPABASE_URL");
      process.exit(1);
    }
    console.log(`Management API → project ${ref}`);
    await viaManagementApi(accessToken, ref);
  } else if (dbUrl) {
    console.log("Postgres → apply SQL");
    await viaPg(dbUrl);
  } else {
    console.log(`
Нет SUPABASE_DB_URL и SUPABASE_ACCESS_TOKEN в .env.local.

Быстрый путь:
1) Supabase → Settings → Database → Connection string (URI)
2) apps/web/.env.local:
   SUPABASE_DB_URL=postgresql://postgres.[ref]:[PASSWORD]@...
3) npm install pg --save-dev
4) node scripts/apply-rpc-confirm.mjs

Или Account → Access Tokens → SUPABASE_ACCESS_TOKEN → node scripts/apply-rpc-confirm.mjs --management-api
`);
    process.exit(1);
  }

  console.log("✓ confirm_teaching_case + schema reload applied\n");
} catch (err) {
  console.error("✗", err.message ?? err);
  process.exit(1);
}
