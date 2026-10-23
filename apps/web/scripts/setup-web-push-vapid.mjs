#!/usr/bin/env node
/**
 * Generate VAPID keys (or read from .env.local) and sync:
 * - Supabase Edge secrets (WEB_PUSH_VAPID_*)
 * - Vercel NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY (production + preview)
 *
 * Usage:
 *   node scripts/setup-web-push-vapid.mjs           # dry-run
 *   node scripts/setup-web-push-vapid.mjs --apply
 *
 * Requires SUPABASE_ACCESS_TOKEN in apps/web/.env.local for Edge secrets.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");
const apply = process.argv.includes("--apply");
const PROJECT_REF = "grnwcbyslttbrqznnunq";
const VAPID_SUBJECT = "mailto:support@sonogyn-pro.ru";

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

function urlBase64(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Same shape as `web-push` generateVAPIDKeys (P-256 / prime256v1). */
function generateVapidPair() {
  const curve = crypto.createECDH("prime256v1");
  curve.generateKeys();
  return {
    publicKey: urlBase64(curve.getPublicKey()),
    privateKey: urlBase64(curve.getPrivateKey()),
  };
}

function vercel(args, input) {
  return spawnSync("npx", ["vercel@latest", ...args], {
    cwd: webRoot,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function upsertVercelPublicKey(publicKey) {
  for (const target of ["production", "preview"]) {
    vercel(["env", "rm", "NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY", target, "--yes"], undefined);
    const { code, stderr, stdout } = vercel(
      ["env", "add", "NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY", target, "--yes"],
      publicKey,
    );
    if (code !== 0) {
      console.warn(`✗ Vercel ${target}: ${(stderr || stdout).trim()}`);
    } else {
      console.log(`✓ Vercel NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY → ${target}`);
    }
  }
}

async function listSecretNames(token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows.map((r) => r.name).filter(Boolean) : [];
}

async function pushSupabaseSecrets(token, publicKey, privateKey) {
  const body = [
    { name: "WEB_PUSH_VAPID_PUBLIC_KEY", value: publicKey },
    { name: "WEB_PUSH_VAPID_PRIVATE_KEY", value: privateKey },
    { name: "WEB_PUSH_VAPID_SUBJECT", value: VAPID_SUBJECT },
  ];
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/secrets`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase secrets POST ${res.status}: ${text.slice(0, 200)}`);
  }
}

const env = { ...process.env, ...loadEnv(envPath) };
const accessToken = env.SUPABASE_ACCESS_TOKEN?.trim();

let publicKey =
  env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ||
  env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ||
  "";
let privateKey = env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim() || "";

const localKeysPath = path.join(webRoot, ".vapid-setup.local.json");

if (!publicKey || !privateKey) {
  if (fs.existsSync(localKeysPath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(localKeysPath, "utf8"));
      publicKey = cached.publicKey?.trim() || publicKey;
      privateKey = cached.privateKey?.trim() || privateKey;
      console.log("ℹ️  Loaded VAPID pair from .vapid-setup.local.json");
    } catch {
      /* generate below */
    }
  }
}

if (!publicKey || !privateKey) {
  console.log("ℹ️  Generating new VAPID key pair (no complete pair in .env.local)…");
  const pair = generateVapidPair();
  publicKey = pair.publicKey;
  privateKey = pair.privateKey;
  fs.writeFileSync(
    localKeysPath,
    JSON.stringify({ publicKey, privateKey, subject: VAPID_SUBJECT }, null, 2),
    { mode: 0o600 },
  );
  console.log(`ℹ️  Saved ${path.basename(localKeysPath)} (gitignored) for Edge secrets sync`);
}

console.log("\n🔔 Web Push VAPID setup\n");
console.log(`  Project ref: ${PROJECT_REF}`);
console.log(`  Public key: present (${publicKey.length} chars)`);
console.log(`  Private key: present (${privateKey.length} chars)`);
console.log(`  Subject: ${VAPID_SUBJECT}`);
console.log(`  Mode: ${apply ? "APPLY" : "dry-run"}\n`);

if (!accessToken) {
  console.log("⚠️  SUPABASE_ACCESS_TOKEN отсутствует в .env.local");
  console.log("   Edge secrets: Dashboard → Project Settings → Edge Functions → Secrets");
  console.log("   Или добавьте токен и повторите с --apply\n");
  if (!apply) process.exit(0);
}

if (!apply) {
  console.log("Dry-run. Добавьте --apply для Supabase + Vercel.\n");
  process.exit(0);
}

if (accessToken) {
  const names = await listSecretNames(accessToken);
  const has = names.filter((n) => n.startsWith("WEB_PUSH_VAPID"));
  if (has.length) {
    console.log(`↷ Supabase already has: ${has.join(", ")} (POST overwrites/adds)`);
  }
  await pushSupabaseSecrets(accessToken, publicKey, privateKey);
  console.log("✓ Supabase Edge secrets WEB_PUSH_VAPID_* set");
} else {
  console.log("⏭️  Skip Supabase secrets (no token)");
}

upsertVercelPublicKey(publicKey);
console.log("\n✅ Done. Redeploy Vercel production to pick up public key if changed.");
console.log("   PWA clients must re-subscribe after public key rotation.\n");
