#!/usr/bin/env node
/**
 * Sync selected env vars from apps/web/.env.local → Vercel (production + preview).
 * Usage: node scripts/sync-vercel-env.mjs
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");

const PRODUCTION_APP_URL = "https://sonogyn-pro.ru";

/** Keys to push when present in .env.local */
const FROM_LOCAL = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SONOGYN_AUTH_INTERNAL_SECRET",
  "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
  "TELEGRAM_BOT_USERNAME",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_ADMIN_IDS",
  "TELEGRAM_ADMIN_CHAT_ID",
  "NEXT_PUBLIC_YANDEX_CLIENT_ID",
  "PERPLEXITY_API_KEY",
  "PERPLEXITY_API_URL",
  "PERPLEXITY_MODEL",
  "PERPLEXITY_EVIDENCE_MODEL",
  "LLM_PROVIDER",
  "OPENROUTER_API_KEY",
  "OPENROUTER_API_URL",
  "OPENROUTER_ORADS_MODEL",
  "OPENROUTER_US_VISION_MODEL",
  "US_AI_WORKER_URL",
  "US_AI_WORKER_SECRET",
  "SMS_PROVIDER",
  "SMSRU_API_ID",
  "SMSRU_FROM",
  "YOOKASSA_SHOP_ID",
  "YOOKASSA_SECRET_KEY",
  "YOOKASSA_PRO_PRICE_RUB",
  "TELEGRAM_ADMIN_CHAT_ID",
  "TELEGRAM_PAYMENTS_CHAT_ID",
  "HTTP_RETRY_ATTEMPTS",
  "HTTP_FETCH_TIMEOUT_MS",
  "HTTP_RETRY_BASE_DELAY_MS",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "VERIFICATION_CODE_PEPPER",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STORAGE_PROVIDER",
  "STORAGE_BUCKET",
  "STORAGE_ACCESS_KEY",
  "STORAGE_SECRET_KEY",
  "STORAGE_ENDPOINT",
  "STORAGE_REGION",
  "BLOB_READ_WRITE_TOKEN",
  "PLAYBACK_TOKEN_SECRET",
  "NEXT_PUBLIC_LIVEKIT_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "AUTH_AUTO_CONFIRM_EMAIL",
  "AUTH_EMAIL_ONLY",
  "NEXT_PUBLIC_AUTH_EMAIL_ONLY",
  "SMTP_HOST",
  "SMTP_CONNECT_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_PASS",
  "SMTP_FROM",
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

function vercel(args, input) {
  const res = spawnSync("npx", ["vercel@latest", ...args], {
    cwd: webRoot,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return { code: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

function envExists(name, target) {
  const { stdout } = vercel(["env", "ls"], undefined);
  const line = stdout
    .split("\n")
    .find((l) => l.trim().startsWith(name + " ") || l.includes(` ${name} `));
  if (!line) return false;
  return line.toLowerCase().includes(target.toLowerCase());
}

/** Always overwrite on Vercel (e.g. domain migration, SMTP mailbox change). */
const FORCE_UPDATE = [
  "NEXT_PUBLIC_APP_URL",
  "AUTH_EMAIL_ONLY",
  "NEXT_PUBLIC_AUTH_EMAIL_ONLY",
  "AUTH_AUTO_CONFIRM_EMAIL",
  "SMTP_HOST",
  "SMTP_CONNECT_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SMTP_FROM",
];

function removeEnv(name, target) {
  vercel(["env", "rm", name, target, "--yes"], undefined);
}

function upsertEnv(name, value, targets, { force = false } = {}) {
  for (const target of targets) {
    const exists = envExists(name, target);
    if (exists && !force && !FORCE_UPDATE.includes(name)) {
      console.log(`↷ skip ${name} (${target}) — already set`);
      continue;
    }
    if (exists && (force || FORCE_UPDATE.includes(name))) {
      removeEnv(name, target);
    }
    const { code, stdout, stderr } = vercel(["env", "add", name, target, "--yes"], value);
    if (code === 0) {
      console.log(`✓ ${exists ? "updated" : "added"} ${name} → ${target}`);
    } else {
      console.warn(`✗ ${name} (${target}): ${(stderr || stdout).trim()}`);
    }
  }
}

const local = loadEnv(envPath);
const targets = ["production", "preview"];

upsertEnv("NEXT_PUBLIC_APP_URL", PRODUCTION_APP_URL, ["production"]);
upsertEnv("NEXT_PUBLIC_APP_URL", PRODUCTION_APP_URL, ["preview"]);

for (const key of FROM_LOCAL) {
  const value = local[key]?.trim();
  if (!value) continue;
  upsertEnv(key, value, targets);
}

// Auth methods: из .env.local или false (SMS + Google включены)
const authEmailOnly = local.AUTH_EMAIL_ONLY?.trim() || "false";
upsertEnv("AUTH_EMAIL_ONLY", authEmailOnly, targets);
upsertEnv(
  "NEXT_PUBLIC_AUTH_EMAIL_ONLY",
  local.NEXT_PUBLIC_AUTH_EMAIL_ONLY?.trim() || authEmailOnly,
  targets,
);
// Mail-first: production must NOT auto-confirm email (user clicks letter).
if (!local.AUTH_AUTO_CONFIRM_EMAIL?.trim()) {
  upsertEnv("AUTH_AUTO_CONFIRM_EMAIL", "false", ["production"]);
} else {
  upsertEnv("AUTH_AUTO_CONFIRM_EMAIL", local.AUTH_AUTO_CONFIRM_EMAIL.trim(), targets);
}

const RECOMMENDED_FOR_EMAIL = [
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AUTH_AUTO_CONFIRM_EMAIL",
];

const REQUIRED_FOR_PRODUCTION_SECURITY = [
  "SONOGYN_AUTH_INTERNAL_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const RECOMMENDED_FOR_US_AI = ["US_AI_WORKER_URL", "US_AI_WORKER_SECRET", "OPENROUTER_US_VISION_MODEL"];
const RECOMMENDED_FOR_SMS = ["SMS_PROVIDER", "SMSRU_API_ID", "SUPABASE_SERVICE_ROLE_KEY"];
const RECOMMENDED_FOR_YOOKASSA = ["YOOKASSA_SHOP_ID", "YOOKASSA_SECRET_KEY"];

const UPSTASH_ENV_ANY = [
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
];

console.log("\n--- Email auth (Mail.ru SMTP + auto-confirm) ---");
for (const key of RECOMMENDED_FOR_EMAIL) {
  const localOk = Boolean(local[key]?.trim());
  const vercelOk = envExists(key, "production");
  const status = localOk && vercelOk ? "ok" : localOk ? "local only" : vercelOk ? "vercel only" : "MISSING";
  console.log(`${status === "ok" ? "✓" : "○"} ${key}: ${status}`);
}
console.log("  → Supabase SMTP: node scripts/configure-supabase-smtp.mjs --apply");
console.log("  → Mail.ru: пароль приложения для Sonogyn-pro@mail.ru (не основной пароль ящика)");

console.log("\n--- Production security checklist ---");
for (const key of REQUIRED_FOR_PRODUCTION_SECURITY) {
  const localOk = Boolean(local[key]?.trim());
  const vercelOk = envExists(key, "production");
  const status = localOk && vercelOk ? "ok" : localOk ? "local only" : vercelOk ? "vercel only" : "MISSING";
  console.log(`${status === "ok" ? "✓" : "○"} ${key}: ${status}`);
}

console.log("\n--- US AI Worker (PRO) ---");
for (const key of RECOMMENDED_FOR_US_AI) {
  const localOk = Boolean(local[key]?.trim());
  const vercelOk = envExists(key, "production");
  const status = localOk && vercelOk ? "ok" : localOk ? "local only" : vercelOk ? "vercel only" : "MISSING";
  console.log(`${status === "ok" ? "✓" : "○"} ${key}: ${status}`);
}
if (!envExists("US_AI_WORKER_URL", "production")) {
  console.log("  → Deploy worker: services/us-ai-worker/docs/DEPLOYMENT.md");
}

console.log("\n--- SMS (Phone auth) ---");
for (const key of RECOMMENDED_FOR_SMS) {
  const localOk = Boolean(local[key]?.trim());
  const vercelOk = envExists(key, "production");
  const status = localOk && vercelOk ? "ok" : localOk ? "local only" : vercelOk ? "vercel only" : "MISSING";
  console.log(`${status === "ok" ? "✓" : "○"} ${key}: ${status}`);
}
if (!envExists("SMSRU_API_ID", "production")) {
  console.log("  → РФ: SMS.ru API ID + SMS_PROVIDER=smsru");
}

console.log("\n--- ЮKassa (РФ billing) ---");
for (const key of RECOMMENDED_FOR_YOOKASSA) {
  const localOk = Boolean(local[key]?.trim());
  const vercelOk = envExists(key, "production");
  const status = localOk && vercelOk ? "ok" : localOk ? "local only" : vercelOk ? "vercel only" : "MISSING";
  console.log(`${status === "ok" ? "✓" : "○"} ${key}: ${status}`);
}
if (!envExists("YOOKASSA_SHOP_ID", "production")) {
  console.log("  → Webhook: https://sonogyn-pro.ru/api/payment/webhook (payment.succeeded)");
}

console.log("\n--- Upstash ---");

if (!envExists("TELEGRAM_BOT_TOKEN", "production")) {
  console.log("○ TELEGRAM_BOT_TOKEN: MISSING on Vercel — Telegram Login не работает");
} else {
  console.log("✓ TELEGRAM_BOT_TOKEN: production");
}

const upstashVercel = UPSTASH_ENV_ANY.some(([urlKey, tokenKey]) =>
  envExists(urlKey, "production") && envExists(tokenKey, "production"),
);
const upstashLocal = UPSTASH_ENV_ANY.some(([urlKey, tokenKey]) =>
  Boolean(local[urlKey]?.trim()) && Boolean(local[tokenKey]?.trim()),
);
const upstashStatus =
  upstashLocal && upstashVercel ? "ok" : upstashVercel ? "vercel only" : upstashLocal ? "local only" : "MISSING";
console.log(`${upstashStatus === "ok" ? "✓" : "○"} Upstash REST (UPSTASH_* or KV_REST_API_*): ${upstashStatus}`);

const FORBIDDEN_IN_PRODUCTION = ["DEV_SKIP_AUTH", "DEV_AUTO_LOGIN", "DEV_AUTH_MODE"];
for (const key of FORBIDDEN_IN_PRODUCTION) {
  const onVercel = envExists(key, "production");
  const inLocal = Boolean(local[key]?.trim() === "true");
  if (onVercel) {
    console.log(`✗ ${key}: SET ON VERCEL — remove immediately (npx vercel env rm ${key} production)`);
  } else if (inLocal) {
    console.log(`○ ${key}: local only (ok for dev)`);
  } else {
    console.log(`✓ ${key}: not on production`);
  }
}

console.log("\nDone. After all keys are on Vercel: Redeploy → Promote to Production.");
