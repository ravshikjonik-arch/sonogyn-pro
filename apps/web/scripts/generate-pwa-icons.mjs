#!/usr/bin/env node
/**
 * Generates PWA icons from public/icons/icon.svg (192, 512, apple-touch 180).
 * Run: node scripts/generate-pwa-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
const svgPath = path.join(webRoot, "public", "icons", "icon.svg");
const outDir = path.join(webRoot, "public", "icons");

async function main() {
  const sharp = (await import("sharp")).default;
  const svg = fs.readFileSync(svgPath);
  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
  ];
  for (const { name, size } of sizes) {
    const out = path.join(outDir, name);
    await sharp(svg).resize(size, size).png().toFile(out);
    console.log(`✓ ${path.relative(webRoot, out)}`);
  }
  // Legacy path used by metadata
  await sharp(svg).resize(512, 512).png().toFile(path.join(webRoot, "public", "icon.png"));
  console.log("✓ public/icon.png");

  const manifestPath = path.join(webRoot, "public", "manifest.json");
  console.log(`✓ sync ${path.relative(webRoot, manifestPath)} via: npm run pwa:icons (edit lib/pwa/site-manifest.ts first)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
