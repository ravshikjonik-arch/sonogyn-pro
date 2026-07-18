#!/usr/bin/env node
/**
 * Pilot smoke — production readiness checks (read-only HTTP).
 * Usage:
 *   node scripts/pilot-smoke.mjs
 *   BASE_URL=https://sonogyn-pro.ru node scripts/pilot-smoke.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = (process.env.BASE_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SonogynPilotSmoke/1.0";

function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

let failed = 0;
let warned = 0;

function ok(label) {
  console.log(`✅ ${label}`);
}
function warn(label, detail) {
  console.log(`⚠️  ${label}${detail ? ` — ${detail}` : ""}`);
  warned += 1;
}
function fail(label, detail) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

async function request(method, pathname, { body, headers = {} } = {}) {
  const init = {
    method,
    headers: { "User-Agent": ua, ...headers },
    cache: "no-store",
  };
  if (body !== undefined) init.body = body;
  const res = await fetch(`${base}${pathname}`, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text: text.slice(0, 200) };
}

console.log(`\n🚀 Pilot smoke · ${base}\n`);

const health = await request("GET", "/api/health");
if (health.status === 200) ok("/api/health → 200");
else fail("/api/health", `HTTP ${health.status}`);

const patients = await request("GET", "/api/patients");
if (patients.status === 401) ok("GET /api/patients без сессии → 401");
else if (patients.status === 403) warn("GET /api/patients", "403 (bot/CORS?) — ожидали 401");
else fail("GET /api/patients", `HTTP ${patients.status}, ожидали 401`);

const cases = await request("GET", "/api/cases?q=test&limit=5");
if ([200, 401].includes(cases.status)) ok(`GET /api/cases → ${cases.status}`);
else if (cases.status === 400)
  warn("GET /api/cases → 400", "часто RLS/схема — примените db:migrate:security на prod Supabase");
else fail("GET /api/cases", `HTTP ${cases.status}, ожидали 200, 401 или 400 (RLS)`);

const debug = await request("GET", "/api/debug/supabase");
if (debug.status === 404) ok("GET /api/debug/supabase → 404 (prod guard)");
else fail("GET /api/debug/supabase", `HTTP ${debug.status}, ожидали 404`);

const webhook = await request("POST", "/api/payment/webhook", {
  headers: { "Content-Type": "application/json" },
  body: "",
});
if ([400, 403].includes(webhook.status)) ok(`POST /api/payment/webhook (пустое тело) → ${webhook.status}`);
else fail("POST /api/payment/webhook", `HTTP ${webhook.status}, ожидали 400 или 403`);

const signIn = await request("POST", "/api/auth/sign-in", {
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
if (signIn.status === 400) ok("POST /api/auth/sign-in (пустое тело) → 400");
else fail("POST /api/auth/sign-in", `HTTP ${signIn.status}, ожидали 400`);

const authStatus = await request("GET", "/api/auth/status");
if (authStatus.status === 200) {
  ok("/api/auth/status → 200");
  const f = authStatus.json?.features ?? {};
  const issues = authStatus.json?.issues ?? [];
  const smsIssueLines = issues.filter((x) => /SMS|sms|EMAIL_ONLY/i.test(String(x)));

  if (f.authEmailOnly) ok("Auth pilot: email-only (SMS/Telegram/Яндекс скрыты)");
  else if (f.smsReady) ok("SMS auth готов на prod (smsReady=true)");
  else if (f.customSmsAuth && f.smsProvider)
    warn("SMS auth", `провайдер ${f.smsProvider}, но smsReady=false — нужен SUPABASE_SERVICE_ROLE_KEY`);
  else if (smsIssueLines.length)
    warn("SMS auth", smsIssueLines.join("; "));
  else warn("SMS auth", "smsReady=false — проверь SMSRU_API_ID + redeploy Production");

  if (f.emailAutoConfirm)
    warn("emailAutoConfirm", "true на prod — пользователи входят без письма; для пилота нужно false");
  else if (f.authEmailOnly) ok("Email confirm: письмо Mail.ru перед входом (autoConfirm=false)");
} else {
  fail("/api/auth/status", `HTTP ${authStatus.status}`);
}

const webinarStatus = await request("GET", "/api/webinars/status");
if (webinarStatus.status === 200) {
  ok("/api/webinars/status → 200");
  const w = webinarStatus.json ?? {};
  if (w.ok) ok("Webinars готовы (LiveKit + Supabase schema)");
  else {
    for (const issue of w.issues ?? []) warn("Webinars", issue);
    if (!w.liveKit?.configured)
      warn("Webinars LiveKit", "задайте NEXT_PUBLIC_LIVEKIT_URL + LIVEKIT_API_KEY/SECRET на Vercel");
    if (!w.database?.ready)
      warn("Webinars DB", "выполните apps/web/supabase/BUNDLE_WEBINAR_ONLY.sql в Supabase SQL Editor");
  }
} else if (webinarStatus.status === 404) {
  warn("/api/webinars/status", "404 — задеployьте последний main на Vercel");
} else {
  fail("/api/webinars/status", `HTTP ${webinarStatus.status}`);
}

const local = loadEnv();
console.log("\n--- Локальные env (для sync на Vercel) ---");
const requiredForProd = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "SONOGYN_AUTH_INTERNAL_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMSRU_API_ID",
];
for (const key of requiredForProd) {
  const v = local[key]?.trim();
  if (!v) warn(`${key}`, "нет в .env.local");
  else if (key === "SONOGYN_AUTH_INTERNAL_SECRET" && v.length < 32)
    warn(key, `длина ${v.length} (<32)`);
  else ok(`${key} — задан локально`);
}

if (local.DEV_SKIP_AUTH === "true") warn("DEV_SKIP_AUTH", "true в .env.local — не пушить на Vercel");

console.log("\n--- Email-only pilot (узкий круг) ---");
console.log("1. Регистрация: https://sonogyn-pro.ru/register — только «Почта»");
console.log("2. Письмо подтверждения от Sonogyn-pro@mail.ru → ссылка → вход");
console.log("3. /verify-phone не показывается (AUTH_EMAIL_ONLY=true)");
console.log("4. Проверка: npm run test:auth:mailru-prod && npm run test:pilot-smoke");

console.log(`\nИтог: ${failed} ошибок, ${warned} предупреждений\n`);
process.exit(failed > 0 ? 1 : 0);
