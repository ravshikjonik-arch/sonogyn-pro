#!/usr/bin/env node
/**
 * Non-blocking Lighthouse smoke for SonoGyn Pro web.
 * Writes JSON+HTML under apps/web/.lighthouse/
 * Exit 0 by default. Set LIGHTHOUSE_STRICT=1 to fail on low scores.
 *
 * Usage:
 *   node scripts/lighthouse-smoke.mjs
 *   BASE_URL=http://127.0.0.1:3000 node scripts/lighthouse-smoke.mjs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const outDir = path.join(webRoot, ".lighthouse");
const baseURL = (process.env.BASE_URL || process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const STRICT = process.env.LIGHTHOUSE_STRICT === "1" || process.env.LIGHTHOUSE_STRICT === "true";

const ROUTES = [
  { id: "landing", path: "/landing" },
  { id: "login", path: "/login" },
];

const MIN = {
  performance: Number(process.env.LH_MIN_PERFORMANCE || 0.5),
  accessibility: Number(process.env.LH_MIN_ACCESSIBILITY || 0.8),
  "best-practices": Number(process.env.LH_MIN_BEST_PRACTICES || 0.7),
  seo: Number(process.env.LH_MIN_SEO || 0.7),
};

fs.mkdirSync(outDir, { recursive: true });

let failed = false;

for (const route of ROUTES) {
  const url = `${baseURL}${route.path}`;
  const prefix = path.join(outDir, route.id);
  console.log(`\n→ Lighthouse ${url}`);

  const result = spawnSync(
    "npx",
    [
      "--yes",
      "lighthouse@12.8.2",
      url,
      "--quiet",
      "--chrome-flags=--headless --no-sandbox --disable-gpu",
      "--only-categories=performance,accessibility,best-practices,seo",
      "--output=json",
      "--output=html",
      `--output-path=${prefix}`,
    ],
    { cwd: webRoot, encoding: "utf8", env: process.env },
  );

  if (result.status !== 0) {
    console.warn(`Lighthouse failed for ${url}:`, (result.stderr || result.stdout || "").slice(0, 500));
    failed = true;
    continue;
  }

  const reportFile = `${prefix}.report.json`;
  let jsonPath = reportFile;
  if (!fs.existsSync(jsonPath)) {
    const alt = fs.readdirSync(outDir).find((f) => f.startsWith(route.id) && f.endsWith(".json"));
    if (!alt) {
      console.warn(`No report JSON for ${route.id}`);
      failed = true;
      continue;
    }
    jsonPath = path.join(outDir, alt);
  }

  const report = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const cats = report.categories || {};
  for (const key of Object.keys(MIN)) {
    const score = cats[key]?.score;
    const ok = typeof score === "number" && score >= MIN[key];
    console.log(`  ${key}: ${score == null ? "n/a" : (score * 100).toFixed(0)} ${ok ? "OK" : "LOW"}`);
    if (!ok) failed = true;
  }
}

console.log(`\nReports: ${outDir}`);
if (STRICT && failed) {
  console.error("Lighthouse strict mode: thresholds not met");
  process.exit(1);
}
console.log(failed ? "Completed with low scores (non-blocking)." : "Completed OK.");
process.exit(0);
