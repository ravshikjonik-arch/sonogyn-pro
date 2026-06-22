#!/usr/bin/env node
/**
 * Verify production SMS OTP when you have the code from SMS.
 * Usage: node --env-file=.env.local scripts/production-sms-verify-with-code.mjs 847291
 */
import { createClient } from "@supabase/supabase-js";

const BASE = process.env.PRODUCTION_URL?.trim() || "https://sonogyn-pro.ru";
const PHONE = process.env.E2E_PHONE?.trim() || "+79933000070";
const code = process.argv[2]?.trim();
if (!/^\d{6}$/.test(code ?? "")) {
  console.error("Usage: node scripts/production-sms-verify-with-code.mjs <6-digit-code>");
  process.exit(1);
}

async function findUser(admin, phone) {
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

const before = await findUser(
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  }),
  PHONE,
);

const res = await fetch(`${BASE}/api/auth/sms/verify`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "User-Agent": "SonoGyn-Prod-E2E/1.0" },
  body: JSON.stringify({ phone: PHONE, code }),
});
const body = await res.json();
const setCookie = res.headers.getSetCookie?.() ?? [];
console.log(JSON.stringify({ status: res.status, body, cookies: setCookie.length, userBefore: before?.id ?? null }, null, 2));

if (res.status !== 200 || !body.ok) process.exit(1);

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const after = await findUser(admin, PHONE);
const { data: profile } = after
  ? await admin.from("profiles").select("id, phone_e164, full_name").eq("id", after.id).maybeSingle()
  : { data: null };
console.log(JSON.stringify({ userAfter: after?.id, profile, sessionCookies: setCookie.length > 0 }, null, 2));
