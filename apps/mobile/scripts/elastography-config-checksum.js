#!/usr/bin/env node
/**
 * Вычисляет SHA-256 checksum для JSON справочника эластографии
 * и записывает его в meta.checksum.
 *
 * Usage:
 *   node scripts/elastography-config-checksum.js path/to/config.json
 *   node scripts/elastography-config-checksum.js assets/test-elastography-config.json --write
 */

const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const fileArg = process.argv[2];
const write = process.argv.includes("--write");

if (!fileArg) {
  console.error("Usage: node scripts/elastography-config-checksum.js <config.json> [--write]");
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), fileArg);
const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));

const payload = JSON.stringify({
  meta: { ...raw.meta, checksum: "" },
  cutoffs: raw.cutoffs,
  ui: raw.ui,
});

const hash = crypto.createHash("sha256").update(payload).digest("hex");
const checksum = `sha256:${hash}`;

console.log("File:", filePath);
console.log("Version:", raw.meta?.version ?? "?");
console.log("Checksum:", checksum);

if (write) {
  raw.meta.checksum = checksum;
  fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + "\n");
  console.log("Written to", filePath);
}
