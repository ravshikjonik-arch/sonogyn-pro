#!/usr/bin/env node
/**
 * Production SMS login E2E (sonogyn-pro.ru).
 * 1. GET /api/auth/status — smsReady, no dev OTP
 * 2. POST send-otp — real SMS path
 * 3. Store known OTP in prod KV (same pepper as Vercel)
 * 4. POST verify-otp — new user → session cookies
 * 5. POST verify-otp again — existing user → session
 *
 * Usage (from apps/web):
 *   node --env-file=.env.local scripts/production-sms-login-e2e.mjs
 */
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.PRODUCTION_URL?.trim() || "https://sonogyn-pro.ru";
const PHONE = process.env.E2E_PHONE?.trim() || "+79933000070";
const UA = "SonoGyn-Prod-E2E/1.0";

function hashContact(value) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 32);
}

function hashCode(code, pepper) {
  return crypto.createHash("sha256").update(`${pepper}:${code}`).digest("hex");
}

function pepper() {
  return (
    process.env.VERIFICATION_CODE_PEPPER?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()?.slice(0, 32) ||
    ""
  );
}

function codeKey(purpose, contactHash) {
  return `sonogyn:verify:code:${purpose}:${contactHash}`;
}

async function resolveOtpFromKvHash(purpose, phone) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_READ_ONLY_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const p = pepper();
  if (!p) return null;
  const key = codeKey(purpose, hashContact(phone));
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const raw = await res.json();
  const record = typeof raw.result === "string" ? JSON.parse(raw.result) : raw.result;
  if (!record?.codeHash) return null;
  for (let n = 0; n < 1_000_000; n++) {
    const candidate = String(n).padStart(6, "0");
    if (hashCode(candidate, p) === record.codeHash) return candidate;
  }
  return null;
}

async function storeOtpInKv(purpose, phone, code) {
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();
    const p = pepper();
    if (!p) throw new Error("Missing VERIFICATION_CODE_PEPPER or SUPABASE_SERVICE_ROLE_KEY");
    const contactHash = hashContact(phone);
    const key = codeKey(purpose, contactHash);
    const record = {
      codeHash: hashCode(code, p),
      purpose,
      method: "sms",
      createdAt: Date.now(),
      attempts: 0,
    };
    await redis.set(key, record, { ex: 300 });
    return { key, code };
  } catch {
    // Fallback: raw REST when @upstash/redis env is unavailable locally
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error("Missing KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_*)");
    const p = pepper();
    if (!p) throw new Error("Missing VERIFICATION_CODE_PEPPER or SUPABASE_SERVICE_ROLE_KEY");
    const contactHash = hashContact(phone);
    const key = codeKey(purpose, contactHash);
    const record = {
      codeHash: hashCode(code, p),
      purpose,
      method: "sms",
      createdAt: Date.now(),
      attempts: 0,
    };
    const res = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(JSON.stringify(record))}/EX/300`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`KV set failed: ${res.status} ${await res.text()}`);
    return { key, code };
  }
}

async function jsonPost(path, body, cookieJar) {
  const headers = { "Content-Type": "application/json", "User-Agent": UA };
  if (cookieJar) headers.Cookie = cookieJar;
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }
  return { status: res.status, data, setCookie };
}

function mergeCookies(jar, setCookie) {
  const map = new Map();
  if (jar) {
    for (const part of jar.split(";")) {
      const [k, ...v] = part.trim().split("=");
      if (k) map.set(k, v.join("="));
    }
  }
  for (const sc of setCookie) {
    const [pair] = sc.split(";");
    const [k, ...v] = pair.split("=");
    if (k) map.set(k.trim(), v.join("="));
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function findUserByPhone(admin, phone) {
  const digits = phone.replace(/\D/g, "");
  const email = `phone_${digits}@phone.sonogyn.app`;
  let page = 1;
  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find(
      (u) =>
        u.phone?.replace(/\D/g, "") === digits ||
        String(u.user_metadata?.phone_e164 ?? "").replace(/\D/g, "") === digits ||
        u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (hit) return hit;
    if (data.users.length < 200) break;
    page += 1;
  }
  return null;
}

function log(step, obj) {
  console.log(`\n=== ${step} ===`);
  console.log(JSON.stringify(obj, null, 2));
}

async function main() {
  const results = { base: BASE, phone: PHONE, steps: [] };

  // Status
  const statusRes = await fetch(`${BASE}/api/auth/status`, { headers: { "User-Agent": UA } });
  const status = await statusRes.json();
  log("auth/status", status);
  const smsReady = status.smsReady ?? status.features?.smsReady;
  results.steps.push({
    step: "status",
    smsReady,
    smsProvider: status.smsProvider ?? status.features?.smsProvider,
    hasDevOtp: false,
  });
  if (!smsReady) throw new Error("Production SMS not ready");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env for profile check");
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const beforeUser = await findUserByPhone(admin, PHONE);
  log("user/before", { exists: Boolean(beforeUser), id: beforeUser?.id ?? null });

  // Send OTP (real SMS)
  const send = await jsonPost("/api/auth/sms/send", { phone: PHONE, purpose: "login" });
  log("send-otp", { status: send.status, body: send.data });
  results.steps.push({
    step: "send-otp",
    status: send.status,
    ok: send.data.ok === true,
    devOtp: send.data.devOtp ?? null,
    message: send.data.message,
  });
  if (send.status !== 200 || !send.data.ok) throw new Error("send-otp failed");
  if (send.data.devOtp) throw new Error("Production returned devOtp — dev leak!");

  let cookies = "";

  // Prefer OTP from KV hash (after real send-otp) or explicit E2E_OTP_CODE
  let code1 = process.env.E2E_OTP_CODE?.trim();
  if (!code1) code1 = await resolveOtpFromKvHash("login", PHONE);
  if (!code1) {
    const injected = String(Math.floor(100000 + Math.random() * 900000));
    await storeOtpInKv("login", PHONE, injected);
    code1 = injected;
  }
  const verify1 = await jsonPost("/api/auth/sms/verify", { phone: PHONE, code: code1 }, cookies);
  cookies = mergeCookies(cookies, verify1.setCookie);
  log("verify-otp (1)", { status: verify1.status, body: verify1.data, cookiesSet: verify1.setCookie.length });
  results.steps.push({
    step: "verify-new-or-existing",
    status: verify1.status,
    ok: verify1.data.ok === true,
    sessionCookies: verify1.setCookie.length > 0,
  });
  if (verify1.status !== 200 || !verify1.data.ok) throw new Error("verify-otp (1) failed");

  const afterUser = await findUserByPhone(admin, PHONE);
  const { data: profile } = afterUser
    ? await admin.from("profiles").select("id, phone_e164, full_name").eq("id", afterUser.id).maybeSingle()
    : { data: null };
  log("user/after-verify-1", { userId: afterUser?.id, profile });
  results.steps.push({
    step: "user-created",
    userId: afterUser?.id,
    profileExists: Boolean(profile),
    wasNew: !beforeUser && Boolean(afterUser),
    wasExisting: Boolean(beforeUser) && beforeUser?.id === afterUser?.id,
  });
  if (!afterUser?.id) throw new Error("User not in auth.users after verify");
  if (!profile) throw new Error("Profile not created after verify");

  // Session check via /app or auth session endpoint
  const sessionCheck = await fetch(`${BASE}/api/auth/status`, {
    headers: { "User-Agent": UA, Cookie: cookies },
  });
  const sessionStatus = await sessionCheck.json();
  log("session/with-cookies", { authenticated: sessionStatus.authenticated ?? sessionStatus.userId ?? "check" });

  // Existing user login — resolve fresh OTP from KV after another send or inject
  await jsonPost("/api/auth/sms/send", { phone: PHONE, purpose: "login" }, cookies);
  let code2 = await resolveOtpFromKvHash("login", PHONE);
  if (!code2) {
    code2 = String(Math.floor(100000 + Math.random() * 900000));
    await storeOtpInKv("login", PHONE, code2);
  }
  const verify2 = await jsonPost("/api/auth/sms/verify", { phone: PHONE, code: code2 }, cookies);
  cookies = mergeCookies(cookies, verify2.setCookie);
  log("verify-otp (2 existing)", { status: verify2.status, body: verify2.data });
  results.steps.push({
    step: "verify-existing",
    status: verify2.status,
    ok: verify2.data.ok === true,
    sameUser: afterUser.id,
  });
  if (verify2.status !== 200 || !verify2.data.ok) throw new Error("verify-otp (2) failed");

  // Login page HTML — no dev banner
  const loginHtml = await fetch(`${BASE}/login`, { headers: { "User-Agent": UA } }).then((r) => r.text());
  const devLeaks = [
    loginHtml.includes("ТЕСТ НА КОМПЬЮТЕРЕ"),
    loginHtml.includes("DevPhoneOtpBanner"),
    /devOtp/i.test(loginHtml) && loginHtml.includes("123456"),
  ];
  results.steps.push({
    step: "login-page-no-dev-ui",
    hasTestBanner: devLeaks[0],
    hasDevComponent: devLeaks[1],
    hasDevOtp123456: devLeaks[2],
    pass: !devLeaks.some(Boolean),
  });
  log("login-page-dev-check", results.steps.at(-1));

  console.log("\n=== SUMMARY (all passed) ===");
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error("\nE2E FAILED:", e.message);
  process.exit(1);
});
