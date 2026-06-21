#!/usr/bin/env node
/**
 * Полный тест email auth:
 * register → resend confirm (Supabase SMTP) → confirm link → login
 *
 * Usage: node scripts/test-email-signup-flow.mjs [email]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = process.env.BASE_URL?.trim() || "http://127.0.0.1:3000";
const ua = "Mozilla/5.0 SonogynEmailSignupFlow/2.0";

function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
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
  const res = await fetch(`${base}${pathname}`, {
    headers: { "User-Agent": ua },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const env = loadEnv();
const stamp = Date.now();
const defaultEmail = `yakubovr564+flow${stamp}@gmail.com`;
const testEmail = process.argv[2]?.trim() || defaultEmail;
const password = "FlowTest123!Sonogyn";
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const redirectTo = `${base.replace(/\/$/, "")}/auth/callback?next=/app`;

let failed = 0;

function ok(label, detail) {
  console.log(`✅ ${label}${detail ? ` — ${detail}` : ""}`);
}
function fail(label, detail) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}
function warn(label, detail) {
  console.log(`⚠️  ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log(`\n🔐 Email signup flow (full) · ${base}`);
console.log(`   Email: ${testEmail}\n`);

const status = await get("/api/auth/status");
if (status.status !== 200) fail("/api/auth/status", `HTTP ${status.status}`);
else ok("/api/auth/status");

const phoneBlock = await post("/api/auth/phone/send-otp", { phone: "+79001234567" });
if (phoneBlock.status === 503) ok("SMS отключён", "503");
else fail("SMS отключён", `HTTP ${phoneBlock.status}`);

const signUp = await post("/api/auth/sign-up", {
  email: testEmail,
  password,
  full_name: "Flow Test Тестович",
  birth_year: 1990,
  specialization: "Акушер-гинеколог",
  preferred_locale: "ru",
});

if (!signUp.json.ok) {
  fail("Регистрация", signUp.json.error ?? `HTTP ${signUp.status}`);
} else if (signUp.json.autoConfirmed) {
  warn("Регистрация", "auto-confirmed — отключите AUTH_AUTO_CONFIRM_EMAIL для теста письма");
} else if (signUp.json.needsEmailConfirmation) {
  ok("Регистрация", "needsEmailConfirmation");
} else {
  ok("Регистрация", "ok");
}

const resend = await post("/api/auth/resend-confirmation", { email: testEmail });
if (resend.json.ok) {
  ok("Письмо подтверждения", resend.json.message ?? "отправлено через Supabase SMTP");
} else {
  const msg = resend.json.error ?? `HTTP ${resend.status}`;
  if (String(msg).includes("отправлено") || String(msg).includes("письмо")) {
    ok("Письмо подтверждения", msg);
  } else {
    fail("Письмо подтверждения", msg);
  }
}

if (!supabaseUrl || !serviceKey) {
  fail("Подтверждение email", "нет SUPABASE_SERVICE_ROLE_KEY — раскомментируйте в .env.local");
} else {
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "signup",
    email: testEmail,
    password,
    options: { redirectTo },
  });

  if (linkError) {
    fail("generateLink (confirm)", linkError.message);
  } else {
    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      fail("generateLink (confirm)", "нет action_link");
    } else {
      const confirmRes = await fetch(actionLink, { redirect: "manual" });
      const okConfirm =
        confirmRes.status >= 200 &&
        confirmRes.status < 400;
      if (okConfirm || confirmRes.status === 302 || confirmRes.status === 303) {
        ok("Подтверждение email", `HTTP ${confirmRes.status}`);
      } else {
        fail("Подтверждение email", `HTTP ${confirmRes.status}`);
      }
    }
  }
}

const signIn = await post("/api/auth/sign-in", { email: testEmail, password });
if (signIn.json.ok) {
  ok("Вход", "сессия создана");
} else if (signIn.json.needsEmailConfirmation) {
  fail("Вход", "email всё ещё не подтверждён");
} else {
  fail("Вход", signIn.json.error ?? `HTTP ${signIn.status}`);
}

console.log(failed ? `\nИтог: ${failed} ошибок\n` : "\nИтог: полный flow пройден ✅\n");
process.exit(failed ? 1 : 0);
