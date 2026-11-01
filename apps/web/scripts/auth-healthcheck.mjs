#!/usr/bin/env node
/**
 * Быстрый аудит каналов регистрации: флаги, SMTP, SMS.ru, Supabase URL.
 * Usage: node scripts/auth-healthcheck.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = val;
  }
  return out;
}

const env = { ...process.env, ...loadEnv(envPath) };
const yes = (v) => ["true", "1", "yes"].includes((v ?? "").trim().toLowerCase());

const report = [];
function row(ok, label, detail = "") {
  report.push(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

row(yes(env.AUTH_ALLOW_PHONE), "AUTH_ALLOW_PHONE", env.AUTH_ALLOW_PHONE || "missing");
row(!yes(env.AUTH_EMAIL_ONLY) || yes(env.AUTH_ALLOW_PHONE), "phone/SMS not blocked by email-only");
row(Boolean(env.SMSRU_API_ID?.trim()), "SMSRU_API_ID");
row((env.SMS_PROVIDER || "").trim() === "smsru" || Boolean(env.SMSRU_API_ID), "SMS provider");
row(Boolean(env.SMTP_HOST && env.SMTP_USER && (env.SMTP_PASSWORD || env.SMTP_PASS)), "SMTP_* set");
row(Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY), "Supabase keys");
row(Boolean(env.TELEGRAM_BOT_TOKEN || env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME), "Telegram bot env");

const apiId = (env.SMSRU_API_ID || "").trim();
if (apiId) {
  try {
    const res = await fetch(`https://sms.ru/my/balance?api_id=${encodeURIComponent(apiId)}&json=1`);
    const json = await res.json();
    row(json.status === "OK", "SMS.ru balance", String(json.balance ?? json.status_code));
  } catch (e) {
    row(false, "SMS.ru balance", e instanceof Error ? e.message : String(e));
  }
}

if (env.SMTP_HOST && env.SMTP_USER && (env.SMTP_PASSWORD || env.SMTP_PASS)) {
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_CONNECT_HOST || env.SMTP_HOST,
      port: Number(env.SMTP_PORT || 587),
      secure: Number(env.SMTP_PORT) === 465,
      auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD || env.SMTP_PASS },
      tls: env.SMTP_CONNECT_HOST ? { servername: env.SMTP_HOST } : undefined,
      requireTLS: Number(env.SMTP_PORT || 587) === 587,
    });
    await transporter.verify();
    row(true, "SMTP verify (login)");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    row(false, "SMTP verify (login)", msg.slice(0, 160));
  }
}

console.log("\n🩺 Auth healthcheck\n");
for (const line of report) console.log(line);
const failed = report.filter((l) => l.startsWith("✗")).length;
console.log(failed ? `\n${failed} issue(s)\n` : "\nAll checks passed\n");
process.exit(failed ? 1 : 0);
