#!/usr/bin/env node
/** Копирует BUNDLE_HARDENING_INCREMENTAL.sql в буфер (macOS pbcopy). */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const bundle = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "BUNDLE_HARDENING_INCREMENTAL.sql",
);

if (!fs.existsSync(bundle)) {
  console.error("Сначала: npm run db:hardening");
  process.exit(1);
}

const sql = fs.readFileSync(bundle, "utf8");
try {
  execSync("pbcopy", { input: sql });
  console.log("✅ SQL скопирован в буфер. Откройте SQL Editor (npm run db:project) → вставьте → Run.");
} catch {
  console.log(`Скопируйте вручную:\n${bundle}`);
}
