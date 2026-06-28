#!/usr/bin/env node
/**
 * Webinars + video on Vercel: Blob store, env vars, optional LiveKit from .env.local.
 * Usage: node scripts/setup-vercel-webinars.mjs
 */
import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const envPath = path.join(webRoot, ".env.local");

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
  return spawnSync("npx", ["vercel@latest", ...args], {
    cwd: webRoot,
    input,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

function upsertEnv(name, value, targets) {
  for (const target of targets) {
    vercel(["env", "rm", name, target, "--yes"], undefined);
    const res = vercel(["env", "add", name, target, "--yes"], value);
    if (res.status === 0) console.log(`✓ ${name} → ${target}`);
    else console.warn(`✗ ${name} (${target}): ${(res.stderr || res.stdout).trim()}`);
  }
}

const local = loadEnv(envPath);
const targets = ["production", "preview"];

console.log("\n1) Vercel Blob store…");
const stores = vercel(["blob", "list-stores"], undefined);
const hasStore = (stores.stdout ?? "").includes("sonogyn-lessons");
if (!hasStore) {
  const created = vercel(["blob", "create-store", "sonogyn-lessons", "--access", "private", "--region", "fra1", "--yes"], undefined);
  if (created.status === 0) console.log("✓ Blob store sonogyn-lessons создан");
  else console.warn("○ Blob store:", (created.stderr || created.stdout).trim());
} else {
  console.log("↷ Blob store sonogyn-lessons уже есть");
}

console.log("\n2) Env vars…");
upsertEnv("STORAGE_PROVIDER", local.STORAGE_PROVIDER?.trim() || "vercel-blob", targets);

const playback =
  local.PLAYBACK_TOKEN_SECRET?.trim() || randomBytes(32).toString("hex");
upsertEnv("PLAYBACK_TOKEN_SECRET", playback, targets);

for (const key of ["BLOB_READ_WRITE_TOKEN", "NEXT_PUBLIC_LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"]) {
  const value = local[key]?.trim();
  if (value) upsertEnv(key, value, targets);
  else console.log(`○ ${key} — нет в .env.local (LiveKit: cloud.livekit.io → Keys)`);
}

console.log("\n3) Sync остальных ключей из .env.local…");
spawnSync("node", ["scripts/sync-vercel-env.mjs"], { cwd: webRoot, stdio: "inherit" });

console.log("\n4) Redeploy…");
const dep = vercel(["--prod", "--yes"], undefined);
if (dep.status === 0) console.log("✓ Production deploy запущен");
else console.warn("Deploy:", (dep.stderr || dep.stdout).slice(-500));

console.log("\nГотово. Проверка: curl -s https://sonogyn-pro.ru/api/webinars/status | jq\n");
