#!/usr/bin/env node
/**
 * Prod smoke: регистрация и вход с @mail.ru через API SonoGyn Pro.
 *
 * Usage:
 *   node scripts/test-mailru-auth-prod.mjs
 *   BASE_URL=https://sonogyn-pro.ru node scripts/test-mailru-auth-prod.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = process.env.BASE_URL?.trim() || "https://sonogyn-pro.ru";
const ua = "Mozilla/5.0 SonogynMailRuCheck/1.0";

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
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function get(pathname) {
  const res = await fetch(`${base}${pathname}`, {
    headers: { "User-Agent": ua },
    cache: "no-store",
  });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

const env = loadEnv();
const stamp = Date.now();
const smtpUser = env.SMTP_USER?.trim() || "sonogyn-pro";
const localPart = smtpUser.includes("@") ? smtpUser.split("@")[0] : smtpUser;
const email = `${localPart}+prodtest${stamp}@mail.ru`.toLowerCase();
const password = "MailRuTest123!Sonogyn";

let failed = 0;

function ok(label, detail) {
  console.log(`✅ ${label}${detail ? ` — ${detail}` : ""}`);
}
function fail(label, detail) {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

console.log(`\n📧 Mail.ru auth prod check · ${base}`);
console.log(`   Email: ${email}\n`);

const status = await get("/api/auth/status");
if (status.status !== 200) fail("auth/status", `HTTP ${status.status}`);
else {
  ok(
    "auth/status",
    `smtp=${status.json.features?.smtpConfigured} sms=${status.json.features?.smsReady}`,
  );
}

const signUp = await post("/api/auth/sign-up", {
  email,
  password,
  full_name: "Mail.ru Prod Test",
  birth_date: "1990-05-15",
  specialization: "Акушер-гинеколог",
  preferred_locale: "ru",
});

if (signUp.json.ok) {
  const needsConfirm = Boolean(signUp.json.needsEmailConfirmation);
  const autoConfirmed = Boolean(signUp.json.autoConfirmed);
  if (needsConfirm && !autoConfirmed) ok("sign-up", "awaiting email confirmation (expected for pilot)");
  else ok("sign-up", `autoConfirmed=${autoConfirmed} needsEmailConfirmation=${needsConfirm}`);
} else {
  fail("sign-up", signUp.json.error ?? `HTTP ${signUp.status}`);
}

let signIn = await post("/api/auth/sign-in", { email, password });
if (signIn.json.ok) {
  ok("sign-in", "session ok");
} else if (signIn.json.needsEmailConfirmation) {
  ok("sign-in blocked until confirm", "expected for email-only pilot");
} else {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (supabaseUrl && serviceKey) {
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const user = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
      signIn = await post("/api/auth/sign-in", { email, password });
      if (signIn.json.ok) ok("sign-in after admin confirm", "session ok");
      else fail("sign-in after confirm", signIn.json.error ?? `HTTP ${signIn.status}`);
    } else {
      fail("sign-in", `${signIn.json.error ?? "failed"} (user not found for confirm)`);
    }
  } else {
    fail("sign-in", signIn.json.error ?? `HTTP ${signIn.status}`);
  }
}

const resend = await post("/api/auth/resend-confirmation", { email });
if (resend.json.ok) ok("resend-confirmation", resend.json.message ?? "ok");
else if (typeof resend.json.error === "string" && resend.json.error.includes("отправлено")) {
  ok("resend-confirmation", resend.json.error);
} else {
  console.log(`⚠️  resend-confirmation — ${resend.json.error ?? "skipped"}`);
}

console.log(failed ? `\nИтог: ${failed} ошибок\n` : "\nИтог: mail.ru flow OK ✅\n");
process.exit(failed ? 1 : 0);
