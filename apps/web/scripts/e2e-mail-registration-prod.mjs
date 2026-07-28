#!/usr/bin/env node
/**
 * End-to-end mail registration on production:
 * sign-up → (admin confirm = email link) → sign-in → no /verify-phone → medical access.
 *
 * Usage:
 *   BASE_URL=https://sonogyn-pro.ru node scripts/e2e-mail-registration-prod.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const base = (process.env.BASE_URL || "https://sonogyn-pro.ru").replace(/\/$/, "");
const ua =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 SonogynMailE2E/1.0";

function loadEnv() {
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

const env = loadEnv();
const stamp = Date.now();
const email = `sonogyn.mail.e2e+${stamp}@mail.ru`.toLowerCase();
const password = `MailE2E-${stamp.toString(36)}!Aa`;

let failed = 0;
function ok(label, detail = "") {
  console.log(`✅ ${label}${detail ? ` — ${detail}` : ""}`);
}
function fail(label, detail = "") {
  console.log(`❌ ${label}${detail ? ` — ${detail}` : ""}`);
  failed += 1;
}

async function post(pathname, body, cookie = "") {
  const res = await fetch(`${base}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": ua,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
    redirect: "manual",
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json, setCookie, headers: res.headers };
}

async function get(pathname, cookie = "") {
  const res = await fetch(`${base}${pathname}`, {
    headers: {
      "User-Agent": ua,
      ...(cookie ? { Cookie: cookie } : {}),
    },
    redirect: "manual",
    cache: "no-store",
  });
  return {
    status: res.status,
    location: res.headers.get("location") || "",
    text: await res.text().catch(() => ""),
  };
}

function mergeCookies(prev, setCookie) {
  const jar = new Map();
  for (const part of (prev || "").split(";").map((s) => s.trim()).filter(Boolean)) {
    const i = part.indexOf("=");
    if (i > 0) jar.set(part.slice(0, i), part.slice(i + 1));
  }
  for (const raw of setCookie || []) {
    const first = raw.split(";")[0];
    const i = first.indexOf("=");
    if (i > 0) jar.set(first.slice(0, i), first.slice(i + 1));
  }
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

console.log(`\n📬 Mail registration E2E · ${base}`);
console.log(`   Email: ${email}\n`);

const status = await get("/api/auth/status");
const statusJson = JSON.parse(status.text || "{}");
const features = statusJson.features || {};
if (status.status !== 200) fail("auth/status", `HTTP ${status.status}`);
else {
  ok(
    "auth/status",
    `authEmailOnly=${features.authEmailOnly} emailAutoConfirm=${features.emailAutoConfirm} smtp=${features.smtpConfigured}`,
  );
  if (!features.authEmailOnly) fail("mail-first flag", "authEmailOnly must be true on prod");
  else ok("mail-first flag", "phone gate off");
}

const signUp = await post("/api/auth/sign-up", {
  email,
  password,
  full_name: "E2E Mail Doctor",
  birth_date: "1988-03-12",
  specialization: "Акушер-гинеколог",
  preferred_locale: "ru",
});

if (!signUp.json.ok) {
  fail("sign-up", signUp.json.error ?? `HTTP ${signUp.status}`);
  process.exit(1);
}

const needsConfirm = Boolean(signUp.json.needsEmailConfirmation);
const autoConfirmed = Boolean(signUp.json.autoConfirmed);
ok("sign-up", `needsEmailConfirmation=${needsConfirm} autoConfirmed=${autoConfirmed}`);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!supabaseUrl || !serviceKey) {
  fail("service role", "SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUser() {
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

let user = await findUser();
if (!user) {
  fail("user created", "not found in auth.users");
  process.exit(1);
}
ok("user created", user.id);

if (needsConfirm && !autoConfirmed) {
  const { error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
  if (error) fail("admin confirm (simulate mail link)", error.message);
  else ok("admin confirm (simulate mail link)", "email_confirmed");
}

const signIn = await post("/api/auth/sign-in", { email, password });
if (!signIn.json.ok) {
  fail("sign-in", signIn.json.error ?? `HTTP ${signIn.status}`);
  process.exit(1);
}
ok("sign-in", "session ok");
let cookie = mergeCookies("", signIn.setCookie);

const appPage = await get("/app", cookie);
if (appPage.status === 307 || appPage.status === 302) {
  const loc = appPage.location;
  if (loc.includes("verify-phone")) fail("reach /app", `redirected to ${loc}`);
  else if (loc.includes("/login")) fail("reach /app", `redirected to login: ${loc}`);
  else ok("reach /app", `redirect ${appPage.status} → ${loc}`);
} else if (appPage.status === 200) {
  ok("reach /app", "HTTP 200");
} else {
  fail("reach /app", `HTTP ${appPage.status}`);
}

const verifyPhone = await get("/verify-phone", cookie);
if (verifyPhone.status === 307 || verifyPhone.status === 302) {
  const loc = verifyPhone.location;
  if (loc.includes("verify-phone")) fail("skip verify-phone", loc);
  else ok("skip verify-phone", `redirect away → ${loc}`);
} else if (verifyPhone.status === 200) {
  fail("skip verify-phone", "page still rendered (should redirect away)");
} else {
  ok("skip verify-phone", `HTTP ${verifyPhone.status}`);
}

const { data: profile, error: profErr } = await admin
  .from("profiles")
  .select("full_name, specialization, birth_year, medical_access_status")
  .eq("id", user.id)
  .maybeSingle();

if (profErr) fail("profile", profErr.message);
else {
  ok(
    "profile",
    `${profile?.full_name} · ${profile?.specialization} · birth=${profile?.birth_year} · access=${profile?.medical_access_status}`,
  );
  const chatReady = ["resident", "doctor", "verified_doctor"].includes(profile?.medical_access_status ?? "");
  if (chatReady) ok("medical access", profile.medical_access_status);
  else fail("medical access", `expected doctor-ready, got ${profile?.medical_access_status}`);
}

const phoneBlocked = await post("/api/auth/phone/send-otp", { phone: "+79001234567" });
if (phoneBlocked.status === 503 || phoneBlocked.json?.disabledMethod === "phone") {
  ok("phone API disabled", `HTTP ${phoneBlocked.status}`);
} else {
  fail("phone API disabled", `expected 503, got ${phoneBlocked.status} ${JSON.stringify(phoneBlocked.json)}`);
}

console.log(failed === 0 ? "\n🎉 Mail registration E2E PASSED\n" : `\n💥 Failed checks: ${failed}\n`);
process.exit(failed === 0 ? 0 : 1);
