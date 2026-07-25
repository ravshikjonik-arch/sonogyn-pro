#!/usr/bin/env node
/**
 * Закрепить admin + verified_doctor за аккаунтами основателя.
 *
 *   cd apps/web && node scripts/ensure-founder-admin.mjs
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env.local)
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
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, i).trim()] = v;
  }
  return out;
}

const FOUNDER_IDS = [
  "55d7a4c9-3dbb-4627-b0f6-a0a1efe01993",
  "d1fb4c18-9cef-4973-b8a4-399f2e8fde59",
  "c044b9a2-0569-4190-805d-f37dc0e15b6e",
  "0458c08a-8e99-46fd-aef9-8f774cc6b58f",
  "d7faa394-0c59-436a-93df-615758687166",
];
const FOUNDER_NAME = "Якубов Равшан Вахобжонович";

const env = { ...loadEnv(envPath), ...process.env };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const patch = {
  role: "admin",
  medical_access_status: "verified_doctor",
  medical_verified_at: new Date().toISOString(),
  medical_verification_note: "Founder admin — permanent grant",
  updated_at: new Date().toISOString(),
};

const byId = await admin.from("profiles").update(patch).in("id", FOUNDER_IDS).select("id, role, medical_access_status");
const byName = await admin
  .from("profiles")
  .update(patch)
  .eq("full_name", FOUNDER_NAME)
  .select("id, role, medical_access_status");

console.log("byId", byId.data?.length ?? 0, byId.error?.message || "ok");
console.log("byName", byName.data?.length ?? 0, byName.error?.message || "ok");
console.log([...(byId.data ?? []), ...(byName.data ?? [])]);
