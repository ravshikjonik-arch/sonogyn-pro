#!/usr/bin/env node
/** Writes public/manifest.json from lib/pwa/site-manifest.ts (SSOT). */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

async function main() {
  const { buildWebAppManifest } = await import("../lib/pwa/site-manifest.ts");
  const out = path.join(webRoot, "public", "manifest.json");
  fs.writeFileSync(out, `${JSON.stringify(buildWebAppManifest(), null, 2)}\n`, "utf8");
  console.log(`✓ ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
