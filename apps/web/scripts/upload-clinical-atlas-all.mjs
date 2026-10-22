#!/usr/bin/env node
/**
 * Upload Supabase-backed atlas folders (see next.config rewrites).
 * Usage: node scripts/upload-clinical-atlas-all.mjs
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const upload = path.join(__dirname, "upload-clinical-atlas-folder.mjs");

/** Folders proxied to Supabase Storage in production */
const FOLDERS = ["prenatal-echo-ru", "neishtadt-ovary"];

function run(folder) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [upload, folder], {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${folder} exit ${code}`))));
  });
}

async function main() {
  for (const folder of FOLDERS) {
    console.log(`\n=== ${folder} ===`);
    await run(folder);
  }
  console.log("\nAll Supabase atlas uploads finished.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
