#!/usr/bin/env node
/** Проверка Google + Telegram auth (без секретов в выводе). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = process.env.BASE_URL?.trim() || "http://127.0.0.1:3000";

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

const env = { ...loadEnv(), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
let failed = 0;

function ok(label) {
  console.log(`✅ ${label}`);
}
function fail(label, detail) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}
function warn(label) {
  console.log(`⚠️  ${label}`);
}

console.log(`\n🔐 Social auth check · ${base}\n`);

if (!env.TELEGRAM_BOT_TOKEN?.trim()) warn("TELEGRAM_BOT_TOKEN не задан");
else ok("TELEGRAM_BOT_TOKEN задан");

if (!env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() && !env.TELEGRAM_BOT_USERNAME?.trim()) {
  warn("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME не задан");
} else ok("Telegram bot username задан");

if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  warn("SUPABASE_SERVICE_ROLE_KEY не задан — Telegram/Google сессия не создастся");
} else ok("SUPABASE_SERVICE_ROLE_KEY задан");

if (url && anon) {
  const redirect = `${base}/auth/callback?next=/app`;
  const authUrl = new URL(`${url.replace(/\/$/, "")}/auth/v1/authorize`);
  authUrl.searchParams.set("provider", "google");
  authUrl.searchParams.set("redirect_to", redirect);
  const res = await fetch(authUrl.toString(), {
    redirect: "manual",
    headers: { apikey: anon, Authorization: `Bearer ${anon}` },
  });
  const loc = res.headers.get("location") ?? "";
  if (res.status === 302 && loc.includes("accounts.google.com")) {
    ok("Supabase → Google redirect работает");
    if (loc.includes("redirect_uri_mismatch") || loc.includes("oauth/error")) {
      fail("Google OAuth", "redirect_uri не совпадает — добавьте в Google Cloud");
    }
  } else if (res.status === 302) {
    ok(`Supabase authorize → ${loc.slice(0, 60)}…`);
  } else {
    fail("Supabase Google authorize", `HTTP ${res.status}`);
  }
  console.log(`   Google redirect URI (вставь в Google Cloud):\n   ${url.replace(/\/$/, "")}/auth/v1/callback`);
} else {
  warn("NEXT_PUBLIC_SUPABASE_* не заданы — пропуск Google probe");
}

try {
  const status = await fetch(`${base}/api/auth/status`, {
    headers: { "User-Agent": "SonogynSocialAuthCheck/1.0" },
  }).then((r) => r.json());
  if (status.features?.telegramReady) ok("API: telegramReady=true");
  else warn("API: telegramReady=false");
} catch {
  warn(`Dev-сервер не отвечает на ${base}`);
}

console.log(failed ? `\nИтог: ${failed} ошибок\n` : "\nИтог: базовая проверка OK\n");
process.exit(failed ? 1 : 0);
