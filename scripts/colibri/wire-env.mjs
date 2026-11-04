#!/usr/bin/env node
/**
 * Append Colibri Gateway env to apps/web/.env.local (no overwrite of existing keys).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const envPath = join(root, "apps/web/.env.local");
if (!existsSync(envPath)) {
  console.error("FAIL: apps/web/.env.local missing — create it first");
  process.exit(1);
}

const model = (process.env.COLIBRI_MODEL || "qwen36-35b").trim();
const desired = {
  COLIBRI_ENABLED: "true",
  COLIBRI_BASE_URL: "http://127.0.0.1:8000/v1",
  COLIBRI_MODEL: model,
  COLIBRI_API_KEY: "colibri-local",
  LLM_PROVIDER: "auto",
  // Cloud-first default; put colibri first only on a dedicated doctor-box.
  LLM_FALLBACK_ORDER: "openrouter,perplexity,colibri",
};

let text = readFileSync(envPath, "utf8");
const existing = new Set();
for (const line of text.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  existing.add(t.split("=", 1)[0]);
}

const additions = [];
for (const [k, v] of Object.entries(desired)) {
  if (existing.has(k)) {
    console.log(`skip ${k} (already set)`);
    continue;
  }
  additions.push(`${k}=${v}`);
  console.log(`add ${k}=${k === "COLIBRI_API_KEY" ? "(local)" : v}`);
}

if (additions.length === 0) {
  console.log("ok: all Colibri keys already present");
  process.exit(0);
}

if (!text.endsWith("\n")) text += "\n";
text += "\n# --- Colibri sidecar (SonoGyn Gateway) ---\n";
text += additions.join("\n") + "\n";
writeFileSync(envPath, text);
console.log("wrote", envPath);
console.log("Restart next dev so Gateway picks up env.");
