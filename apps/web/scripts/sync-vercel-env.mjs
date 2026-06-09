#!/usr/bin/env node
/**
 * Sync selected env vars from apps/web/.env.local → Vercel (production + preview).
 * Usage: node scripts/sync-vercel-env.mjs
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");

const PRODUCTION_APP_URL = "https://sonogyn-pro-web-ravshan-s-projects3.vercel.app";

/** Keys to push when present in .env.local */
const FROM_LOCAL = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SONOGYN_AUTH_INTERNAL_SECRET",
  "NEXT_PUBLIC_TELEGRAM_BOT_USERNAME",
  "TELEGRAM_BOT_USERNAME",
  "TELEGRAM_BOT_TOKEN",
  "NEXT_PUBLIC_VK_CLIENT_ID",
  "NEXT_PUBLIC_YANDEX_CLIENT_ID",
  "OPENROUTER_API_KEY",
  "OPENROUTER_API_URL",
  "OPENROUTER_ORADS_MODEL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
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

function vercel(args, input) {
  const res = spawnSync("npx", ["vercel@latest", ...args], {
    cwd: webRoot,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
  return { code: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

function envExists(name, target) {
  const { stdout } = vercel(["env", "ls"], undefined);
  const line = stdout
    .split("\n")
    .find((l) => l.trim().startsWith(name + " ") || l.includes(` ${name} `));
  if (!line) return false;
  return line.toLowerCase().includes(target.toLowerCase());
}

function upsertEnv(name, value, targets) {
  for (const target of targets) {
    if (envExists(name, target)) {
      console.log(`↷ skip ${name} (${target}) — already set`);
      continue;
    }
    const { code, stdout, stderr } = vercel(["env", "add", name, target, "--yes"], value);
    if (code === 0) {
      console.log(`✓ added ${name} → ${target}`);
    } else {
      console.warn(`✗ ${name} (${target}): ${(stderr || stdout).trim()}`);
    }
  }
}

const local = loadEnv(envPath);
const targets = ["production", "preview"];

upsertEnv("NEXT_PUBLIC_APP_URL", PRODUCTION_APP_URL, ["production"]);
upsertEnv("NEXT_PUBLIC_APP_URL", PRODUCTION_APP_URL, ["preview"]);

for (const key of FROM_LOCAL) {
  const value = local[key]?.trim();
  if (!value) continue;
  upsertEnv(key, value, targets);
}

console.log("\nDone. Run Redeploy on Vercel to apply new env vars.");
