#!/usr/bin/env node
/**
 * Creates/updates two synthetic Auth users for EMR IDOR smoke and writes .env.staging-idor.
 * Uses SUPABASE_SERVICE_ROLE_KEY from apps/web/.env.local (same project as dev).
 * Does not print passwords to stdout.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envLocalPath = path.join(webRoot, ".env.local");
const stagingEnvPath = path.join(webRoot, ".env.staging-idor");

const EMAIL_A = "staging-idor-user-a@sonogyn-pro.invalid";
const EMAIL_B = "staging-idor-user-b@sonogyn-pro.invalid";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const k = line.slice(0, eq).trim();
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function randomPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

function mergeStagingEnv(existing, patch) {
  const lines = fs.existsSync(stagingEnvPath)
    ? fs.readFileSync(stagingEnvPath, "utf8").split("\n")
    : fs.readFileSync(path.join(webRoot, ".env.staging-idor.example"), "utf8").split("\n");

  const map = new Map();
  for (const line of lines) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    map.set(line.slice(0, eq).trim(), line.slice(eq + 1).trim());
  }
  for (const [k, v] of Object.entries(patch)) map.set(k, v);

  const header = `# Generated/updated by setup-staging-idor-users.mjs — do not commit\n`;
  const body = [
    "STAGING_APP_URL=http://localhost:3000",
    `STAGING_SUPABASE_PROJECT_REF=${patch.STAGING_SUPABASE_PROJECT_REF}`,
    "STAGING_CLEANUP=1",
    `IDOR_USER_A_EMAIL=${EMAIL_A}`,
    `IDOR_USER_A_PASSWORD=${map.get("IDOR_USER_A_PASSWORD") ?? patch.IDOR_USER_A_PASSWORD}`,
    `IDOR_USER_B_EMAIL=${EMAIL_B}`,
    `IDOR_USER_B_PASSWORD=${map.get("IDOR_USER_B_PASSWORD") ?? patch.IDOR_USER_B_PASSWORD}`,
    "",
  ].join("\n");
  fs.writeFileSync(stagingEnvPath, header + body, "utf8");
}

async function findUserIdByEmail(admin, targetEmail) {
  const target = targetEmail.toLowerCase();
  const { data, error } = await admin.from("users").select("id").eq("email", target).maybeSingle();
  if (error) return null;
  return data?.id ?? null;
}

async function ensureUser(admin, email, password) {
  const metadata = {
    full_name: email.includes("-a@") ? "Staging IDOR A" : "Staging IDOR B",
    specialization: "Тест (staging IDOR)",
    birth_year: 1990,
  };
  let userId = await findUserIdByEmail(admin, email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error && !/already|registered|exists/i.test(error.message)) throw error;
    userId = data.user?.id ?? (await findUserIdByEmail(admin, email));
  }
  if (!userId) throw new Error(`No user id for ${email}`);

  const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (updateErr) throw updateErr;

  const nowIso = new Date().toISOString();
  const row = {
    full_name: metadata.full_name,
    specialization: metadata.specialization,
    institution: null,
    birth_year: metadata.birth_year,
    updated_at: nowIso,
  };
  await admin.from("profiles").update(row).eq("id", userId);
  await admin.from("users").upsert({ id: userId, email, ...row }, { onConflict: "id" });
  return userId;
}

async function main() {
  const env = { ...loadEnv(envLocalPath), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const ref = url?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "";

  if (!url || !anon || !serviceKey) {
    console.error("❌ Need NEXT_PUBLIC_SUPABASE_* and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const passA = randomPassword();
  const passB = randomPassword();

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("→ Ensuring staging IDOR users in Supabase Auth…");
  await ensureUser(admin, EMAIL_A, passA);
  await ensureUser(admin, EMAIL_B, passB);

  const pub = createClient(url, anon, { auth: { persistSession: false } });
  for (const [email, password] of [
    [EMAIL_A, passA],
    [EMAIL_B, passB],
  ]) {
    const { error } = await pub.auth.signInWithPassword({ email, password });
    if (error) throw new Error(`Sign-in check failed for ${email}: ${error.message}`);
  }

  mergeStagingEnv({}, {
    STAGING_SUPABASE_PROJECT_REF: ref,
    IDOR_USER_A_PASSWORD: passA,
    IDOR_USER_B_PASSWORD: passB,
  });

  console.log(`✅ Users ready · wrote ${path.basename(stagingEnvPath)} (passwords not logged)`);
  console.log("   Next: pnpm dev:web (or npm run dev) then npm run test:staging-emr-idor");
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
