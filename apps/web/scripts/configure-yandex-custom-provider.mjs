#!/usr/bin/env node
/**
 * Point Supabase custom:yandex UserInfo URL at our Bearer→OAuth proxy.
 * Usage (from apps/web): node scripts/configure-yandex-custom-provider.mjs
 */
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = { ...loadEnv(envPath), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const appOrigin = (env.NEXT_PUBLIC_APP_URL || "https://sonogyn-pro.ru").replace(/\/$/, "");
const userinfoUrl = `${appOrigin}/api/auth/yandex/userinfo`;
const identifier = "custom:yandex";

if (!url || !serviceKey) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
}).auth.admin;

const { data: listed, error: listErr } = await admin.customProviders.listProviders();
if (listErr) {
  console.error("listProviders failed:", listErr.message);
  process.exit(1);
}

const providers = listed?.providers ?? listed ?? [];
const existing = (Array.isArray(providers) ? providers : []).find(
  (p) => p?.identifier === identifier || p?.identifier === "yandex",
);

console.log("userinfo_url →", userinfoUrl);
console.log(
  "existing:",
  existing
    ? {
        identifier: existing.identifier,
        enabled: existing.enabled,
        userinfo_url: existing.userinfo_url,
        email_optional: existing.email_optional,
      }
    : null,
);

const patch = {
  userinfo_url: userinfoUrl,
  authorization_url: "https://oauth.yandex.ru/authorize",
  token_url: "https://oauth.yandex.ru/token",
  scopes: ["login:info", "login:email"],
  email_optional: true,
  enabled: true,
  // Provider-side PKCE with Yandex has been flaky through GoTrue; keep off.
  pkce_enabled: false,
  attribute_mapping: {
    sub: "sub",
    email: "email",
    name: "name",
    preferred_username: "preferred_username",
    given_name: "given_name",
    family_name: "family_name",
    picture: "picture",
  },
};

const id = existing?.identifier || identifier;
const { data: updated, error: updErr } = await admin.customProviders.updateProvider(id, patch);
if (updErr) {
  console.error("updateProvider failed:", updErr.message);
  process.exit(1);
}

console.log("updated:", {
  identifier: updated?.identifier ?? id,
  userinfo_url: updated?.userinfo_url ?? userinfoUrl,
  enabled: updated?.enabled ?? true,
});
console.log("OK — retry Yandex login on https://sonogyn-pro.ru/login");
