#!/usr/bin/env node
/**
 * Set Supabase Auth Site URL + Redirect allow list for mail-first production.
 *
 * Usage:
 *   node scripts/configure-supabase-auth-urls.mjs
 *   node scripts/configure-supabase-auth-urls.mjs --apply
 *
 * Requires SUPABASE_ACCESS_TOKEN in apps/web/.env.local
 * (Supabase → Account → Access Tokens).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const apply = process.argv.includes("--apply");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = val;
  }
  return out;
}

function projectRefFromUrl(url) {
  try {
    return new URL(url).hostname.split(".")[0];
  } catch {
    return null;
  }
}

const env = { ...process.env, ...loadEnv(envPath) };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef = projectRefFromUrl(supabaseUrl ?? "");
const siteUrl = "https://sonogyn-pro.ru";
const uriAllowList = [
  "https://sonogyn-pro.ru/**",
  "https://sonogyn-pro.ru/auth/callback",
  "https://sonogyn-pro.ru/auth/reset-password",
  "http://localhost:3000/**",
  "http://localhost:3000/auth/callback",
  "https://*-ravshan-s-projects3.vercel.app/**",
  "https://sonogyn-pro-web-ravshan-s-projects3.vercel.app/**",
].join(",");

console.log("\n🔐 Supabase Auth URL Configuration (mail-first)\n");
console.log(`  Project: ${projectRef || "?"}`);
console.log(`  Site URL: ${siteUrl}`);
console.log(`  Redirect URLs:\n    ${uriAllowList.split(",").join("\n    ")}`);
console.log("  Confirm email: ON (mailer_autoconfirm=false)\n");

if (!projectRef) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL не задан");
  process.exit(1);
}

const payload = {
  site_url: siteUrl,
  uri_allow_list: uriAllowList,
  mailer_autoconfirm: false,
  external_email_enabled: true,
};

if (!accessToken) {
  console.log("⚠️  SUPABASE_ACCESS_TOKEN нет в .env.local — сделайте вручную:\n");
  console.log(`  1. https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration`);
  console.log(`     Site URL = ${siteUrl}`);
  console.log("     Redirect URLs = список выше");
  console.log(`  2. https://supabase.com/dashboard/project/${projectRef}/auth/providers`);
  console.log("     Email → Confirm email = ON\n");
  console.log("  Или: Access Tokens → SUPABASE_ACCESS_TOKEN в .env.local →");
  console.log("       node scripts/configure-supabase-auth-urls.mjs --apply\n");
  process.exit(0);
}

if (!apply) {
  console.log("Dry-run. Добавьте --apply для PATCH Management API.\n");
  process.exit(0);
}

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
});
const body = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error("✗ Supabase API error:", res.status, body.message ?? JSON.stringify(body));
  process.exit(1);
}

console.log("✓ Site URL + Redirect URLs обновлены");
console.log(`  Dashboard: https://supabase.com/dashboard/project/${projectRef}/auth/url-configuration\n`);
