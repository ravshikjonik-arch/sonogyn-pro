#!/usr/bin/env node
/**
 * Сброс пароля врача для пилота + проверка входа.
 * Usage: node scripts/reset-doctor-password.mjs user@example.com
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
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
  console.error("Usage: node scripts/reset-doctor-password.mjs user@example.com");
  process.exit(1);
}

const env = { ...process.env, ...loadEnv(envPath) };
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !anon || !serviceKey) {
  console.error("✗ Missing Supabase env in .env.local");
  process.exit(1);
}

const tempPassword = `SonoGyn-${crypto.randomBytes(3).toString("hex")}`;
const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUser() {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found;
    if (data.users.length < 200) break;
  }
  return null;
}

const user = await findUser();
if (!user) {
  console.error(`✗ Пользователь не найден: ${email}`);
  process.exit(1);
}

const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
  password: tempPassword,
  email_confirm: true,
});
if (upErr) {
  console.error("✗ updateUserById:", upErr.message);
  process.exit(1);
}

const pub = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
const { error: signErr } = await pub.auth.signInWithPassword({ email, password: tempPassword });
if (signErr) {
  console.error("✗ signInWithPassword:", signErr.message);
  process.exit(1);
}

const prodSignIn = await fetch("https://sonogyn-pro.ru/api/auth/sign-in", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: tempPassword }),
});
const prodJson = await prodSignIn.json().catch(() => ({}));

console.log(`✓ Пароль сброшен: ${email}`);
console.log(`  Временный пароль: ${tempPassword}`);
console.log(`  Supabase sign-in: OK`);
console.log(`  Prod /api/auth/sign-in: HTTP ${prodSignIn.status} ok=${prodJson.ok ?? false}`);
if (!prodJson.ok && prodJson.error) console.log(`  Prod error: ${prodJson.error}`);
