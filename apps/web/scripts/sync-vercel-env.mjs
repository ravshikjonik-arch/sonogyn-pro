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

const REQUIRED_FOR_PRODUCTION_SECURITY = [
  "SONOGYN_AUTH_INTERNAL_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const UPSTASH_ENV_ANY = [
  ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
];

console.log("\n--- Production security checklist ---");
for (const key of REQUIRED_FOR_PRODUCTION_SECURITY) {
  const localOk = Boolean(local[key]?.trim());
  const vercelOk = envExists(key, "production");
  const status = localOk && vercelOk ? "ok" : localOk ? "local only" : vercelOk ? "vercel only" : "MISSING";
  console.log(`${status === "ok" ? "✓" : "○"} ${key}: ${status}`);
}

const upstashVercel = UPSTASH_ENV_ANY.some(([urlKey, tokenKey]) =>
  envExists(urlKey, "production") && envExists(tokenKey, "production"),
);
const upstashLocal = UPSTASH_ENV_ANY.some(([urlKey, tokenKey]) =>
  Boolean(local[urlKey]?.trim()) && Boolean(local[tokenKey]?.trim()),
);
const upstashStatus =
  upstashLocal && upstashVercel ? "ok" : upstashVercel ? "vercel only" : upstashLocal ? "local only" : "MISSING";
console.log(`${upstashStatus === "ok" ? "✓" : "○"} Upstash REST (UPSTASH_* or KV_REST_API_*): ${upstashStatus}`);

const FORBIDDEN_IN_PRODUCTION = ["DEV_SKIP_AUTH", "DEV_AUTO_LOGIN"];
for (const key of FORBIDDEN_IN_PRODUCTION) {
  const onVercel = envExists(key, "production");
  const inLocal = Boolean(local[key]?.trim() === "true");
  if (onVercel) {
    console.log(`✗ ${key}: SET ON VERCEL — remove immediately (npx vercel env rm ${key} production)`);
  } else if (inLocal) {
    console.log(`○ ${key}: local only (ok for dev)`);
  } else {
    console.log(`✓ ${key}: not on production`);
  }
}

console.log("\nDone. After all keys are on Vercel: Redeploy → Promote to Production.");
