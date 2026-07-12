#!/usr/bin/env node
/**
 * Полный E2E email auth:
 * 1) Supabase SMTP (Management API, если SUPABASE_ACCESS_TOKEN)
 * 2) Регистрация (Supabase signUp, без server auto-confirm)
 * 3) Resend confirmation (Supabase SMTP)
 * 4) Confirm через admin generateLink (симуляция клика по письму)
 * 5) Login через API
 *
 * Usage: node scripts/test-email-signup-flow-full.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = process.env.BASE_URL?.trim() || "http://127.0.0.1:3000";
const ua = "Mozilla/5.0 SonogynEmailSignupFull/1.0";

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

async function post(pathname, body) {
  const res = await fetch(`${base}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": ua },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const env = { ...process.env, ...loadEnv(envPath) };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef = projectRefFromUrl(supabaseUrl ?? "");

const smtpHost = env.SMTP_HOST?.trim();
const smtpPort = Number.parseInt(env.SMTP_PORT?.trim() ?? "587", 10);
const smtpUser = env.SMTP_USER?.trim();
const smtpPass = (env.SMTP_PASSWORD ?? env.SMTP_PASS)?.trim();
const smtpFrom = env.SMTP_FROM?.trim() || smtpUser || "noreply@sonogyn-pro.ru";

const stamp = Date.now();
const testEmail = `yakubovr564+full${stamp}@gmail.com`;
const password = "FullFlow123!Sonogyn";
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

console.log(`\n🔐 Full email signup flow · ${base}`);
console.log(`   Email: ${testEmail}\n`);

// --- Step 0: Configure Supabase SMTP ---
console.log("── 0. Supabase Auth SMTP ──");

if (!accessToken) {
  warn(
    "SUPABASE_ACCESS_TOKEN не задан",
    "SMTP в Dashboard вручную → " +
      `https://supabase.com/dashboard/project/${projectRef}/auth/smtp`,
  );
} else if (!smtpHost || !smtpUser || !smtpPass) {
  fail("SMTP env", "SMTP_HOST / SMTP_USER / SMTP_PASSWORD");
} else {
  const payload = {
    external_email_enabled: true,
    mailer_autoconfirm: false,
    smtp_admin_email: smtpFrom.includes("<")
      ? smtpFrom.match(/<([^>]+)>/)?.[1] ?? smtpFrom
      : smtpFrom,
    smtp_sender_name: "SonoGyn Pro",
    smtp_host: smtpHost,
    smtp_port: smtpPort,
    smtp_user: smtpUser,
    smtp_pass: smtpPass,
    external_google_enabled: false,
    external_phone_enabled: false,
  };

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) ok("Supabase SMTP configured", `port ${smtpPort}`);
  else fail("Supabase SMTP API", `${res.status} ${body.message ?? JSON.stringify(body)}`);
}

if (!serviceKey || !supabaseUrl || !anonKey) {
  fail("Prerequisites", "SUPABASE_SERVICE_ROLE_KEY + Supabase URL/anon key");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- Step 1: Register (direct Supabase — без server auto-confirm) ---
console.log("\n── 1. Register ──");

const signUp = await anon.auth.signUp({
  email: testEmail,
  password,
  options: {
    emailRedirectTo: redirectTo,
    data: {
      full_name: "Full Flow Test",
      birth_year: 1990,
      specialization: "Акушер-гинеколог",
      preferred_locale: "ru",
    },
  },
});

if (signUp.error) {
  fail("Supabase signUp", signUp.error.message);
} else if (!signUp.data.user) {
  fail("Supabase signUp", "no user");
} else if ((signUp.data.user.identities?.length ?? 0) === 0) {
  fail("Supabase signUp", "email уже зарегистрирован");
} else {
  ok("User created", signUp.data.user.id);
  if (signUp.data.user.email_confirmed_at) {
    warn("Email already confirmed at signup", "проверьте mailer_autoconfirm в Supabase");
  } else {
    ok("Awaiting email confirmation");
  }
}

// --- Step 2: Resend confirmation (app API → Supabase SMTP) ---
console.log("\n── 2. Send confirmation email ──");

const resend = await post("/api/auth/resend-confirmation", { email: testEmail });
if (resend.json.ok) ok("Resend confirmation", "письмо отправлено через Supabase SMTP");
else if (
  typeof resend.json.error === "string" &&
  resend.json.error.includes("отправлено")
) {
  ok("Resend confirmation", resend.json.error);
} else {
  fail("Resend confirmation", resend.json.error ?? `HTTP ${resend.status}`);
}

// --- Step 3: Confirm email (admin generateLink → visit link) ---
console.log("\n── 3. Confirm email ──");

const linkRes = await admin.auth.admin.generateLink({
  type: "signup",
  email: testEmail,
  password,
  options: { redirectTo },
});

if (linkRes.error || !linkRes.data?.properties?.action_link) {
  fail("generateLink", linkRes.error?.message ?? "no action_link");
} else {
  const actionLink = linkRes.data.properties.action_link;
  const confirmRes = await fetch(actionLink, { redirect: "manual" });
  const confirmed =
    confirmRes.status === 302 ||
    confirmRes.status === 303 ||
    confirmRes.status === 200 ||
    confirmRes.status === 0;
  if (confirmed) ok("Email confirmed via action link", `HTTP ${confirmRes.status}`);
  else fail("Confirm link visit", `HTTP ${confirmRes.status}`);
}

// --- Step 4: Login ---
console.log("\n── 4. Login ──");

const signIn = await post("/api/auth/sign-in", { email: testEmail, password });
if (signIn.json.ok) ok("Login", "сессия создана");
else fail("Login", signIn.json.error ?? `HTTP ${signIn.status}`);

console.log(failed ? `\nИтог: ${failed} ошибок\n` : "\nИтог: полный flow пройден ✅\n");
process.exit(failed ? 1 : 0);
