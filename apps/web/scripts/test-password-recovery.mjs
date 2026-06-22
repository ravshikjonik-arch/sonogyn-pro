#!/usr/bin/env node
/**
 * Диагностика восстановления пароля Supabase Auth.
 *
 * Usage:
 *   node scripts/test-password-recovery.mjs [email]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

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

const env = { ...process.env, ...loadEnv(envPath) };
const email = process.argv[2]?.trim() || "yakubovr564@gmail.com";
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const smtpUser = env.SMTP_USER?.trim() ?? "";
const smtpFrom = env.SMTP_FROM?.trim() ?? "";

console.log("\n🔐 Password recovery diagnostic\n");
console.log(`  Supabase: ${supabaseUrl ?? "MISSING"}`);
console.log(`  Email:    ${email}`);
console.log(`  SMTP user (local .env): ${smtpUser || "MISSING"}`);

if (smtpUser.includes("sandbox") || smtpUser.includes("mailgun.org") && smtpUser.startsWith("smtp@sandbox")) {
  console.log("\n⚠️  LOCAL .env.local использует Mailgun SANDBOX — это НЕ production mg.sonogyn-pro.ru");
  console.log("   Supabase Dashboard SMTP должен быть: postmaster@mg.sonogyn-pro.ru\n");
} else if (smtpUser.includes("mg.sonogyn-pro.ru") || smtpUser.startsWith("postmaster@")) {
  console.log("\n✓ SMTP user похож на production Mailgun domain\n");
}

if (!smtpFrom) {
  console.log("⚠️  SMTP_FROM не задан локально — для Supabase задайте: SonoGyn Pro <noreply@sonogyn-pro.ru>\n");
}

if (!supabaseUrl || !anonKey) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing");
  process.exit(1);
}

// 1) Public recover endpoint (same as login page)
const recoverRes = await fetch(`${supabaseUrl}/auth/v1/recover`, {
  method: "POST",
  headers: {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ email }),
});

const recoverBody = await recoverRes.text();
console.log("--- POST /auth/v1/recover ---");
console.log(`  HTTP ${recoverRes.status}`);
if (recoverBody) console.log(`  Body: ${recoverBody.slice(0, 200)}`);

if (recoverRes.status === 429) {
  console.log("\n  → 429 = rate limit (нормально после частых запросов). Подождите 60 с и повторите.");
  console.log("  → Это НЕ ошибка SMTP 535/500. Auth принял запрос, но ограничил частоту.\n");
} else if (recoverRes.status === 500) {
  console.log("\n  ✗ 500 = Error sending recovery email — проверьте Supabase → Auth → SMTP\n");
} else if (recoverRes.status === 200) {
  console.log("\n  ✓ 200 = запрос принят, Supabase поставил письmo в очередь (если SMTP OK)\n");
}

// 2) Admin: user exists + generate recovery link
if (!serviceKey) {
  console.log("--- Admin (service role) ---");
  console.log("  SKIP: SUPABASE_SERVICE_ROLE_KEY not set\n");
  process.exit(recoverRes.ok ? 0 : 1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listData, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

console.log("--- Admin: user lookup ---");
if (listError) {
  console.log(`  ✗ listUsers: ${listError.message}`);
} else {
  const user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (user) {
    console.log(`  ✓ User found: ${user.id}`);
    console.log(`    email_confirmed: ${Boolean(user.email_confirmed_at)}`);
    console.log(`    last_sign_in: ${user.last_sign_in_at ?? "never"}`);
  } else {
    console.log(`  ✗ User NOT found for ${email}`);
  }
}

const link = await admin.auth.admin.generateLink({
  type: "recovery",
  email,
  options: {
    redirectTo: `${env.NEXT_PUBLIC_APP_URL?.trim() || "https://sonogyn-pro.ru"}/auth/callback?next=${encodeURIComponent("/auth/reset-password?recovery=1")}`,
  },
});

console.log("\n--- Admin: generateLink(recovery) ---");
if (link.error) {
  console.log(`  ✗ ${link.error.message}`);
} else {
  console.log("  ✓ Recovery link generated (user_recovery_requested flow OK at API level)");
  const actionLink = link.data?.properties?.action_link;
  if (actionLink) {
    console.log(`  action_link host: ${new URL(actionLink).host}`);
  }
}

console.log("\n--- DNS mg.sonogyn-pro.ru ---");
try {
  const { execSync } = await import("node:child_process");
  const spf = execSync("dig +short TXT mg.sonogyn-pro.ru 2>/dev/null", { encoding: "utf8" }).trim();
  const mx = execSync("dig +short MX mg.sonogyn-pro.ru 2>/dev/null", { encoding: "utf8" }).trim();
  const dkim = execSync("dig +short TXT k1._domainkey.mg.sonogyn-pro.ru 2>/dev/null", { encoding: "utf8" }).trim();
  console.log(`  SPF:  ${spf || "MISSING"}`);
  console.log(`  MX:   ${mx.replace(/\n/g, " | ") || "MISSING"}`);
  console.log(`  DKIM: ${dkim ? "OK (k1._domainkey)" : "check Dashboard"}`);
} catch {
  console.log("  (dig unavailable — run manually)");
}

console.log("");

process.exit(recoverRes.status === 500 ? 1 : 0);
