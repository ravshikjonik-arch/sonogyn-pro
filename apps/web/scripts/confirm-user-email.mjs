#!/usr/bin/env node
/**
 * Подтвердить email пользователя в Supabase (обход письма).
 *
 * Usage:
 *   node scripts/confirm-user-email.mjs user@example.com
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

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/confirm-user-email.mjs user@example.com");
  process.exit(1);
}

const env = { ...process.env, ...loadEnv(envPath) };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserId(targetEmail) {
  const target = targetEmail.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

const user = await findUserId(email);
if (!user) {
  console.error(`✗ Пользователь не найден: ${email}`);
  process.exit(1);
}

if (user.email_confirmed_at) {
  console.log(`✓ Уже подтверждён: ${email}`);
  process.exit(0);
}

const { error } = await admin.auth.admin.updateUserById(user.id, { email_confirm: true });
if (error) {
  console.error("✗", error.message);
  process.exit(1);
}

console.log(`✓ Email подтверждён: ${email}`);
console.log("  Можно войти на https://sonogyn-pro-web-ravshan-s-projects3.vercel.app/login");
