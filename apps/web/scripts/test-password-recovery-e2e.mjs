#!/usr/bin/env node
/**
 * E2E password recovery against deployed app (TokenHash flow simulation).
 *
 * Usage:
 *   node scripts/test-password-recovery-e2e.mjs [baseUrl] [email]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

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

const env = { ...process.env, ...loadEnv(envPath) };
const base = (process.argv[2]?.trim() || env.NEXT_PUBLIC_APP_URL?.trim() || "https://sonogyn-pro.ru").replace(
  /\/$/,
  "",
);
const email = process.argv[3]?.trim() || "yakubovr564@gmail.com";
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const tempPassword = `RecoveryTest-${Date.now().toString(36)}!9`;

const results = [];

function pass(step, detail) {
  results.push({ step, status: "PASS", detail });
  console.log(`✓ ${step}: ${detail}`);
}

function fail(step, detail) {
  results.push({ step, status: "FAIL", detail });
  console.log(`✗ ${step}: ${detail}`);
}

console.log(`\n🔐 E2E recovery → ${base}\n`);

// 1) Forgot password API (sends email)
const forgotRes = await fetch(`${base}/api/auth/forgot-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ email }),
});
const forgotJson = await forgotRes.json().catch(() => ({}));
if (forgotRes.ok && forgotJson.ok) {
  pass("forgot-password API", `HTTP ${forgotRes.status}`);
} else {
  fail("forgot-password API", `HTTP ${forgotRes.status} ${JSON.stringify(forgotJson)}`);
}

if (!serviceKey) {
  fail("e2e callback", "SUPABASE_SERVICE_ROLE_KEY missing — cannot simulate email link");
  process.exit(1);
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const link = await admin.auth.admin.generateLink({
  type: "recovery",
  email,
  options: {
    redirectTo: `${base}/auth/callback?next=${encodeURIComponent("/auth/reset-password?recovery=1")}`,
  },
});

const tokenHash = link.data?.properties?.hashed_token;
if (link.error || !tokenHash) {
  fail("generateLink", link.error?.message ?? "no hashed_token");
  process.exit(1);
}
pass("generateLink", "hashed_token OK (simulates TokenHash email)");

const callbackUrl = new URL("/auth/callback", base);
callbackUrl.searchParams.set("token_hash", tokenHash);
callbackUrl.searchParams.set("type", "recovery");
callbackUrl.searchParams.set("next", "/auth/reset-password?recovery=1");

const callbackRes = await fetch(callbackUrl.toString(), { redirect: "manual" });
const setCookies = callbackRes.headers.getSetCookie?.() ?? [];
if (callbackRes.status >= 300 && callbackRes.status < 400) {
  const location = callbackRes.headers.get("location") ?? "";
  if (location.includes("reset-password")) {
    pass("auth/callback", `redirect ${callbackRes.status} → reset-password`);
  } else if (location.includes("error") || location.includes("otp_expired")) {
    fail("auth/callback", `bad redirect: ${location}`);
  } else {
    pass("auth/callback", `redirect ${callbackRes.status} → ${location.slice(0, 120)}`);
  }
} else {
  fail("auth/callback", `HTTP ${callbackRes.status}`);
}

const cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
if (!cookieHeader) {
  fail("session cookies", "no Set-Cookie from callback");
  process.exit(1);
}
pass("session cookies", `${setCookies.length} cookie(s) set`);

const updateRes = await fetch(`${base}/api/auth/update-password`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: cookieHeader },
  body: JSON.stringify({ password: tempPassword }),
});
const updateJson = await updateRes.json().catch(() => ({}));
if (updateRes.ok && updateJson.ok) {
  pass("update-password API", "password updated");
} else {
  fail("update-password API", `HTTP ${updateRes.status} ${JSON.stringify(updateJson)}`);
  process.exit(1);
}

const signInRes = await fetch(`${base}/api/auth/sign-in`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: tempPassword }),
});
const signInJson = await signInRes.json().catch(() => ({}));
if (signInRes.ok && signInJson.ok) {
  pass("sign-in new password", "login OK");
} else {
  fail("sign-in new password", `HTTP ${signInRes.status} ${JSON.stringify(signInJson)}`);
}

console.log(`\n--- Temp password used for test: ${tempPassword} ---\n`);
const failed = results.filter((r) => r.status === "FAIL").length;
process.exit(failed > 0 ? 1 : 0);
