#!/usr/bin/env node
/**
 * Быстрая проверка входа/регистрации (локально: npm run test:auth).
 * Требует запущенный dev-сервер на BASE_URL (по умолчанию http://127.0.0.1:3000).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = process.env.BASE_URL?.trim() || "http://127.0.0.1:3000";
const ua = "Mozilla/5.0 SonogynAuthSmoke/1.0";

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

async function post(pathname, body) {
  const res = await fetch(`${base}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": ua },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

async function get(pathname) {
  const res = await fetch(`${base}${pathname}`, { headers: { "User-Agent": ua }, cache: "no-store" });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const env = loadEnv();
let failed = 0;

function ok(label) {
  console.log(`✅ ${label}`);
}
function fail(label, detail) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

console.log(`\n🔐 Auth smoke · ${base}\n`);

const status = await get("/api/auth/status");
if (status.status !== 200) {
  fail("/api/auth/status", `HTTP ${status.status}`);
} else {
  ok("/api/auth/status");
  if (!status.json.features?.emailAutoConfirm) {
    console.log("   ⚠️  emailAutoConfirm=false — нужен SUPABASE_SERVICE_ROLE_KEY");
  }
  if (env.DEV_SKIP_AUTH === "true") {
    console.log("   ⚠️  DEV_SKIP_AUTH=true — вход обходится, поставьте false для реального теста");
  }
}

const devEmail = env.DEV_LOGIN_EMAIL;
const devPassword = env.DEV_LOGIN_PASSWORD;
if (devEmail && devPassword) {
  const signIn = await post("/api/auth/sign-in", { email: devEmail, password: devPassword });
  if (signIn.json.ok) ok(`Вход ${devEmail}`);
  else fail(`Вход ${devEmail}`, signIn.json.error ?? `HTTP ${signIn.status}`);
} else {
  console.log("   ⏭  DEV_LOGIN_EMAIL/PASSWORD не заданы");
}

const testEmail = `smoke-${Date.now()}@example.test`;
const signUp = await post("/api/auth/sign-up", {
  email: testEmail,
  password: "SmokeTest123!Sonogyn",
  full_name: "Смоук Тест Тестович",
  birth_year: 1990,
  specialization: "Акушер-гинеколог",
  preferred_locale: "ru",
});
if (signUp.json.ok) {
  if (signUp.json.needsEmailConfirmation && !signUp.json.autoConfirmed) {
    console.log(`⚠️  Регистрация OK, но нужно письмо (${testEmail})`);
  } else {
    ok(`Регистрация ${testEmail}`);
  }
} else {
  fail("Регистрация", signUp.json.error ?? `HTTP ${signUp.status}`);
}

console.log(failed ? `\nИтог: ${failed} ошибок\n` : "\nИтог: всё ок\n");
process.exit(failed ? 1 : 0);
