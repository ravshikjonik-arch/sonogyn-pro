#!/usr/bin/env node
/**
 * Генерация PDF полного аудита SonoGyn Pro из HTML.
 * Usage: node apps/web/scripts/generate-audit-report-pdf.mjs
 */
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const htmlPath = path.join(repoRoot, "docs/audits/sonogyn-pro-full-audit-2026-06-25.html");
const pdfPath = path.join(repoRoot, "docs/audits/sonogyn-pro-full-audit-2026-06-25.pdf");

if (!fs.existsSync(htmlPath)) {
  console.error("HTML not found:", htmlPath);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, "utf8");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  margin: { top: "12mm", right: "12mm", bottom: "14mm", left: "12mm" },
});
await browser.close();

console.log("PDF written:", pdfPath);
