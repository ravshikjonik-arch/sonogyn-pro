#!/usr/bin/env node
/**
 * Post-build audit: precache URLs in generated sw.js must not include API/Supabase/PHI routes.
 * Usage: after `next build --webpack` → `pnpm pwa:audit`
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const swPath = path.join(publicDir, "sw.js");
const strict = process.env.PWA_AUDIT_STRICT === "1";

const FORBIDDEN_IN_PRECACHE = [
  /supabase\.co/i,
  /^\/api\//,
  /^\/auth\//,
  /^\/admin/,
  /^\/profile\/patients/,
  /^\/patients/,
];

function extractPrecacheUrls(swText) {
  const urls = new Set();
  const patterns = [
    /url:\s*"([^"]+)"/g,
    /"url"\s*:\s*"([^"]+)"/g,
    /precacheAndRoute\(\[(.*?)\]\)/s,
  ];
  for (const re of patterns.slice(0, 2)) {
    for (const m of swText.matchAll(re)) {
      if (m[1]?.startsWith("/") || m[1]?.startsWith("http")) urls.add(m[1]);
    }
  }
  return [...urls];
}

function main() {
  if (!fs.existsSync(swPath)) {
    const msg = "public/sw.js не найден — пропуск (нужен `next build --webpack` без DISABLE_PWA=1).";
    if (strict) {
      console.error(`❌ ${msg}`);
      process.exit(1);
    }
    console.log(msg);
    return;
  }

  const swText = fs.readFileSync(swPath, "utf8");
  const precacheUrls = extractPrecacheUrls(swText);

  if (precacheUrls.length === 0) {
    console.warn("⚠️  Не удалось извлечь precache URL из sw.js — проверьте вручную в DevTools.");
  } else {
    console.log(`Precache URLs in sw.js (parsed): ${precacheUrls.length}`);
  }

  const violations = [];
  for (const url of precacheUrls) {
    const pathOnly = url.startsWith("http") ? new URL(url).pathname : url;
    for (const rule of FORBIDDEN_IN_PRECACHE) {
      if (rule.test(pathOnly) || rule.test(url)) {
        violations.push(url);
        break;
      }
    }
  }

  if (violations.length) {
    console.error("❌ Запрещённые URL в precache manifest:");
    violations.forEach((u) => console.error(`  • ${u}`));
    process.exit(1);
  }

  if (!/NetworkOnly/i.test(swText)) {
    console.warn("⚠️  В sw.js не найден NetworkOnly — проверьте runtimeCaching.");
  } else {
    console.log("✓ NetworkOnly handler присутствует в sw.js");
  }

  if (!swText.includes("sg-never-cache") && !swText.includes("sg-api-no-cache")) {
    console.warn("⚠️  Ожидаемые cacheName sg-never-cache / sg-api-no-cache не найдены.");
  } else {
    console.log("✓ Имена runtime-кэшей sg-never-cache / sg-api-no-cache найдены");
  }

  const sizeKb = Math.round(fs.statSync(swPath).size / 1024);
  console.log(`sw.js size: ~${sizeKb} KiB`);
  if (sizeKb > 512) {
    console.warn(`⚠️  sw.js > 512 KiB — проверьте precache volume.`);
  }

  console.log("✓ PWA SW audit passed (precache policy).");
}

main();
