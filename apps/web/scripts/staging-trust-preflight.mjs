#!/usr/bin/env node
/**
 * Preflight for trust staging smoke (no secrets printed).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROD_SUPABASE_REF = "grnwcbyslttbrqznnunq";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function fail(msg) {
  console.error(`❌ Preflight: ${msg}`);
  process.exit(1);
}

const webRoot = path.join(__dirname, "..");
const local = loadEnv(path.join(webRoot, ".env.local"));
const staging = loadEnv(path.join(webRoot, ".env.staging-idor"));
const env = { ...local, ...staging, ...process.env };

if (!env.NEXT_PUBLIC_SUPABASE_URL?.trim()) fail("NEXT_PUBLIC_SUPABASE_URL missing in .env.local");
if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) fail("SUPABASE_SERVICE_ROLE_KEY missing in .env.local");

const baseUrl = (env.STAGING_APP_URL ?? env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
if (env.IDOR_USER_A_EMAIL && !baseUrl) {
  fail("Set STAGING_APP_URL for HTTP smoke (or NEXT_PUBLIC_APP_URL)");
}

const urlRef = env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";
const stagingRef = (env.STAGING_SUPABASE_PROJECT_REF ?? "").trim();
if (stagingRef && urlRef && stagingRef !== urlRef) {
  console.warn(`⚠️  STAGING_SUPABASE_PROJECT_REF (${stagingRef}) ≠ URL (${urlRef})`);
}

if (urlRef === PROD_SUPABASE_REF && env.STAGING_ALLOW_PROD_DATABASE !== "YES_I_CONFIRM") {
  let host = "";
  try {
    host = new URL(baseUrl || "http://localhost:3000").hostname;
  } catch {
    /* ignore */
  }
  if (host && host !== "localhost" && host !== "127.0.0.1") {
    fail(`Prod Supabase ref on non-localhost app URL — use branch or STAGING_ALLOW_PROD_DATABASE=YES_I_CONFIRM`);
  }
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const dashboard = urlRef
  ? `https://supabase.com/dashboard/project/${urlRef}`
  : "https://supabase.com/dashboard/projects";

console.log(`✅ Trust preflight OK`);
console.log(`   Supabase ref : ${urlRef || "?"}`);
console.log(`   API URL      : ${supabaseUrl || "—"}`);
console.log(`   Dashboard    : ${dashboard}`);
console.log(`   App (HTTP)   : ${baseUrl || "—"}`);
