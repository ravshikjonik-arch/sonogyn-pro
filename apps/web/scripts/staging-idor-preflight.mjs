#!/usr/bin/env node
/**
 * Guards before staging EMR IDOR smoke (creates a synthetic patient).
 * Does not print secrets.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROD_SUPABASE_REF = "grnwcbyslttbrqznnunq";

const PRODUCTION_APP_HOSTS = new Set([
  "sonogyn-pro-web-ravshan-s-projects3.vercel.app",
  "sonogyn-pro.ru",
  "www.sonogyn-pro.ru",
]);

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

function fail(msg) {
  console.error(`❌ Preflight: ${msg}`);
  process.exit(1);
}

const envFile = path.join(__dirname, "..", ".env.staging-idor");
if (!fs.existsSync(envFile)) {
  fail(
    `Missing ${path.basename(envFile)} — copy from .env.staging-idor.example (see docs/operations/staging-idor-quickstart.md)`,
  );
}

const env = { ...loadEnv(envFile), ...process.env };
const baseUrl = (env.STAGING_APP_URL ?? "").replace(/\/$/, "");
if (!baseUrl) fail("Set STAGING_APP_URL in .env.staging-idor");

let host;
try {
  host = new URL(baseUrl).hostname.toLowerCase();
} catch {
  fail("STAGING_APP_URL is not a valid URL");
}

if (PRODUCTION_APP_HOSTS.has(host)) {
  fail(
    `STAGING_APP_URL host "${host}" looks like production. Use a Supabase branch + localhost or an isolated preview env.`,
  );
}

const stagingRef = (env.STAGING_SUPABASE_PROJECT_REF ?? "").trim();
if (!stagingRef) {
  fail(
    "Set STAGING_SUPABASE_PROJECT_REF to the Supabase project/branch ref that STAGING_APP_URL uses (not prod).",
  );
}

const isLocalhost = host === "localhost" || host === "127.0.0.1";
if (
  stagingRef === PROD_SUPABASE_REF &&
  env.STAGING_ALLOW_PROD_DATABASE !== "YES_I_CONFIRM" &&
  !isLocalhost
) {
  fail(
    `STAGING_SUPABASE_PROJECT_REF is prod (${PROD_SUPABASE_REF}). Use localhost + STAGING_CLEANUP=1, a Supabase branch (Pro plan), or STAGING_ALLOW_PROD_DATABASE=YES_I_CONFIRM.`,
  );
}
if (stagingRef === PROD_SUPABASE_REF && isLocalhost) {
  console.warn(
    "⚠️  localhost + prod Supabase ref: smoke may create/delete a synthetic patient (STAGING_CLEANUP). Prefer a branch when available.",
  );
}

for (const key of ["IDOR_USER_A_EMAIL", "IDOR_USER_A_PASSWORD", "IDOR_USER_B_EMAIL", "IDOR_USER_B_PASSWORD"]) {
  if (!env[key]?.trim()) fail(`Set ${key} in .env.staging-idor (synthetic accounts on staging only)`);
}

console.log(`✅ Preflight OK · app host=${host} · supabase ref=${stagingRef}`);
