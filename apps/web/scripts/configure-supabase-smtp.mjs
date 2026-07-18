#!/usr/bin/env node
/**
 * Настройка Supabase Auth SMTP (Mail.ru) через Management API.
 *
 * Usage:
 *   node scripts/configure-supabase-smtp.mjs
 *   node scripts/configure-supabase-smtp.mjs --apply
 *
 * Требует SUPABASE_ACCESS_TOKEN (Personal Access Token) и SMTP_* в .env.local
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
    const host = new URL(url).hostname;
    return host.split(".")[0];
  } catch {
    return null;
  }
}

const env = { ...process.env, ...loadEnv(envPath) };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef = projectRefFromUrl(supabaseUrl ?? "");

const smtpHost = env.SMTP_HOST?.trim();
const smtpPort = Number.parseInt(env.SMTP_PORT?.trim() ?? "587", 10);
const smtpUser = env.SMTP_USER?.trim();
const smtpPass = (env.SMTP_PASSWORD ?? env.SMTP_PASS)?.trim();
const smtpFrom =
  env.SMTP_FROM?.trim() ||
  env.SMTP_ADMIN_EMAIL?.trim() ||
  smtpUser ||
  "noreply@sonogyn-pro.ru";

console.log("\n📬 Supabase Auth → Mail.ru SMTP\n");

if (!supabaseUrl || !projectRef) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL не задан в .env.local");
  process.exit(1);
}

if (!smtpHost || !smtpUser || !smtpPass) {
  console.error("✗ SMTP_HOST / SMTP_USER / SMTP_PASSWORD не заданы");
  process.exit(1);
}

const payload = {
  smtp_admin_email: smtpFrom.includes("<") ? smtpFrom.match(/<([^>]+)>/)?.[1] ?? smtpFrom : smtpFrom,
  smtp_sender_name: smtpFrom.includes("<")
    ? smtpFrom.replace(/<[^>]+>/, "").trim()
    : "SonoGyn Pro",
  smtp_host: smtpHost,
  smtp_port: smtpPort,
  smtp_user: smtpUser,
  smtp_pass: smtpPass,
  external_email_enabled: true,
  mailer_autoconfirm: false,
  external_google_enabled: false,
  external_phone_enabled: false,
};

console.log(`  Project: ${projectRef}`);
console.log(`  SMTP host: ${payload.smtp_host}:${payload.smtp_port}`);
console.log(`  SMTP user: ${smtpUser}`);

if (smtpUser.includes("sandbox") || smtpHost.includes("mailgun")) {
  console.log("\n⚠️  Для production используйте Mail.ru: Sonogyn-pro@mail.ru @ smtp.mail.ru:465\n");
}

if (!smtpFrom || smtpFrom.includes("sandbox") || smtpFrom.includes("noreply@sonogyn-pro.ru")) {
  console.log("⚠️  Рекомендуется SMTP_FROM=SonoGyn Pro <Sonogyn-pro@mail.ru>\n");
}
  console.log(`  Sender:    ${payload.smtp_sender_name} <${payload.smtp_admin_email}>`);
  console.log("  ⚠️  Mail.ru: Sender email ДОЛЖЕН совпадать с SMTP User (Sonogyn-pro@mail.ru)");
  console.log("      Иначе Supabase → 550 not local sender over smtp\n");

if (!accessToken) {
  console.log("⚠️  SUPABASE_ACCESS_TOKEN не задан — ручная настройка в Dashboard:\n");
  console.log("  1. https://supabase.com/dashboard/project/" + projectRef + "/auth/smtp");
  console.log("  2. Enable Custom SMTP");
  console.log(`     Host: ${payload.smtp_host}`);
  console.log(`     Port: ${payload.smtp_port} (если 587 не работает — 2525)`);
  console.log(`     User: ${smtpUser}`);
  console.log(`     Pass: (из SMTP_PASSWORD)`);
  console.log(`     Sender email: ${payload.smtp_admin_email}  (не noreply@ и не другой домен!)`);
  console.log(`     Sender name:  ${payload.smtp_sender_name}`);
  console.log("  3. Authentication → Providers → Google OFF, Phone OFF");
  console.log("  4. URL Configuration → Site URL + /auth/callback\n");
  console.log("  Для автоматизации: Supabase → Account → Access Tokens → SUPABASE_ACCESS_TOKEN в .env.local");
  process.exit(0);
}

if (!apply) {
  console.log("Dry-run. Добавьте --apply для отправки в Supabase Management API.\n");
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

console.log("✓ Supabase Auth SMTP обновлён через Management API");
console.log("  Проверьте: Dashboard → Authentication → SMTP → Test email\n");
