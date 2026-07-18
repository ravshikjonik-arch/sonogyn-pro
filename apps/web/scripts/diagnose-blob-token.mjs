#!/usr/bin/env node
/**
 * Проверка BLOB_READ_WRITE_TOKEN для private store sonogyn-lessons.
 * Usage (from apps/web): node scripts/diagnose-blob-token.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { putPrivateBlob } from "./lib/blob-upload.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

async function main() {
  const env = {
    ...loadEnv(path.join(webRoot, ".env.local.save")),
    ...loadEnv(path.join(webRoot, ".env.local")),
    ...process.env,
  };
  const token = env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    console.error("✗ BLOB_READ_WRITE_TOKEN не найден в .env.local");
    console.error("  npx vercel env pull .env.local   (из apps/web)");
    process.exit(1);
  }

  console.log("Проверка private upload (1 KB test)…");
  const body = Buffer.alloc(1024, 0);
  const pathname = `diagnostics/token-check-${Date.now()}.bin`;

  const blob = await putPrivateBlob(pathname, body, {
    token,
    contentType: "application/octet-stream",
  });

  console.log("✓ OK — токен совместим с private store");
  console.log(`  URL: ${blob.url}`);
  if (!blob.url.includes(".private.blob.vercel-storage.com")) {
    console.warn("⚠ URL не из private store — проверьте, что проект привязан к sonogyn-lessons");
  }
}

main().catch((err) => {
  console.error("✗", err instanceof Error ? err.message : err);
  process.exit(1);
});
