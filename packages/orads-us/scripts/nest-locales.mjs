/**
 * Converts flat orads.* locale JSON to nested { "orads": { ... } } structure.
 * Usage: node scripts/nest-locales.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, "..", "locales");
const codes = ["ru", "en", "es", "fr", "ar"];

function setNested(root, parts, value) {
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] == null || typeof cur[p] !== "object") cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function nestFlat(flat) {
  const orads = {};
  for (const [key, value] of Object.entries(flat)) {
    if (!key.startsWith("orads.")) continue;
    setNested(orads, key.slice("orads.".length).split("."), value);
  }
  return { orads };
}

for (const code of codes) {
  const path = join(localesDir, `${code}.json`);
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const flat =
    raw.orads && typeof raw.orads === "object" && !raw["orads.meta"]
      ? flattenToDot(raw)
      : raw;
  const nested = nestFlat(flat);
  writeFileSync(path, `${JSON.stringify(nested, null, 2)}\n`, "utf8");
  console.log(`nested ${code}.json`);
}

function flattenToDot(obj, prefix = "orads") {
  const out = {};
  for (const [k, v] of Object.entries(obj.orads ?? obj)) {
    const key = `${prefix}.${k}`;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenBranch(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

function flattenBranch(obj, prefix) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = `${prefix}.${k}`;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenBranch(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}
