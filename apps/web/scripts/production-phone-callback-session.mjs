#!/usr/bin/env node
/** Production session smoke via magiclink (same as establishPhoneAuthSession). */
import { createClient } from "@supabase/supabase-js";

const PHONE = process.env.E2E_PHONE?.trim() || "+79933000070";
const BASE = process.env.PRODUCTION_URL?.trim() || "https://sonogyn-pro.ru";
const digits = PHONE.replace(/\D/g, "");
const email = `phone_${digits}@phone.sonogyn.app`;

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data: linkData, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error || !linkData.properties.hashed_token) {
  console.error("generateLink failed", error?.message);
  process.exit(1);
}

const verifyUrl = `${BASE}/auth/callback?token_hash=${encodeURIComponent(linkData.properties.hashed_token)}&type=email&next=${encodeURIComponent("/app")}`;
const res = await fetch(verifyUrl, { redirect: "manual", headers: { "User-Agent": "SonoGyn-Prod-E2E/1.0" } });
const setCookie = res.headers.getSetCookie?.() ?? [];
const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");

console.log(JSON.stringify({ callbackStatus: res.status, location: res.headers.get("location"), cookieCount: setCookie.length }, null, 2));

const sessionRes = await fetch(`${BASE}/api/auth/session`, {
  headers: { Cookie: cookieHeader, "User-Agent": "SonoGyn-Prod-E2E/1.0" },
});
const session = await sessionRes.json();
console.log(
  JSON.stringify(
    {
      sessionStatus: sessionRes.status,
      userId: session.user?.id ?? null,
      phone: session.user?.user_metadata?.phone_e164 ?? session.user?.phone ?? null,
    },
    null,
    2,
  ),
);

if (!session.user?.id) process.exit(1);
