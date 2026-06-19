#!/usr/bin/env node
/**
 * Проверка SMS и auth-конфигурации (локально или production URL).
 * Usage:
 *   node scripts/check-sms-connection.mjs
 *   node scripts/check-sms-connection.mjs https://sonogyn-pro-web-ravshan-s-projects3.vercel.app
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    out[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  return out;
}

async function checkSmsRuBalance(apiId) {
  const url = `https://sms.ru/my/balance?api_id=${encodeURIComponent(apiId)}&json=1`;
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (json?.status === "OK") {
    return { ok: true, balance: json.balance };
  }
  return { ok: false, code: json?.status_code ?? res.status };
}

const base =
  process.argv[2]?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:3000";

console.log(`\n🔍 Auth/SMS check → ${base}/api/auth/status\n`);

let status;
try {
  const res = await fetch(`${base}/api/auth/status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  status = await res.json();
} catch (e) {
  console.error(`✗ Сервер недоступен: ${e.message}`);
  console.log("  Запустите: npm run dev:web (из корня репо)");
  process.exit(1);
}

const f = status.features ?? {};
console.log(`SMS provider:     ${f.smsProvider ?? "—"}`);
console.log(`Custom SMS path:  ${f.customSmsAuth ? "✓" : "✗"}`);
console.log(`SMS ready:        ${f.smsReady ? "✓" : "✗"} (нужен service role + провайдер)`);
console.log(`Turnstile:        ${f.turnstileConfigured ? "✓" : "—"}`);

if (status.issues?.length) {
  console.log("\nЗамечания:");
  for (const i of status.issues) console.log(`  ○ ${i}`);
}

const local = loadEnv(envPath);
if (local.SMSRU_API_ID) {
  console.log("\n📱 SMS.ru balance check…");
  const bal = await checkSmsRuBalance(local.SMSRU_API_ID);
  if (bal.ok) console.log(`  ✓ Баланс SMS.ru: ${bal.balance} ₽`);
  else console.log(`  ✗ SMS.ru API: код ${bal.code} (проверьте SMSRU_API_ID)`);
} else {
  console.log("\n📱 SMS.ru: SMSRU_API_ID не в .env.local");
  if (f.smsProvider === "mock") {
    console.log("  Dev mock: OTP-код → консоль сервера [auth:sms] mock_sent");
  }
}

console.log("\nProduction Vercel env:");
console.log("  SMS_PROVIDER=smsru");
console.log("  SMSRU_API_ID=…");
console.log("  SUPABASE_SERVICE_ROLE_KEY=…");
console.log("  → cd apps/web && node scripts/sync-vercel-env.mjs\n");

process.exit(f.smsReady || f.smsProvider === "mock" ? 0 : 1);
