#!/usr/bin/env node
/**
 * Fails if packages/database mirror diverges from apps/web (SSOT).
 * - Every file in mirror must exist in web with identical SHA-256.
 * - Extra files in mirror (not in web) fail the check.
 * - Web-only files are allowed (mirror is a subset copy after sync).
 * - Warns on identical content under different basenames.
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WEB_DIR = path.join(ROOT, "apps/web/supabase/migrations");
const PKG_DIR = path.join(ROOT, "packages/database/supabase/migrations");

function sha256File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function listSql(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

function main() {
  const webFiles = listSql(WEB_DIR);
  const pkgFiles = listSql(PKG_DIR);

  if (webFiles.length === 0) {
    console.error("❌ No migrations in apps/web/supabase/migrations");
    process.exit(1);
  }

  const webHashByName = new Map();
  const hashToWebNames = new Map();

  for (const f of webFiles) {
    const h = sha256File(path.join(WEB_DIR, f));
    webHashByName.set(f, h);
    const names = hashToWebNames.get(h) ?? [];
    names.push(f);
    hashToWebNames.set(h, names);
  }

  let failed = false;

  const pkgOnly = pkgFiles.filter((f) => !webFiles.includes(f));
  if (pkgOnly.length > 0) {
    failed = true;
    console.error("❌ Mirror has files not present in web SSOT:");
    for (const f of pkgOnly) console.error(`   - ${f}`);
    console.error("   Run: pnpm --filter @repo/database sync-from-web");
  }

  for (const f of pkgFiles) {
    if (!webFiles.includes(f)) continue;
    const webH = webHashByName.get(f);
    const pkgH = sha256File(path.join(PKG_DIR, f));
    if (webH !== pkgH) {
      failed = true;
      console.error(`❌ Content drift for ${f}`);
      console.error(`   web: ${webH.slice(0, 12)}…`);
      console.error(`   pkg: ${pkgH.slice(0, 12)}…`);
    }
  }

  const pkgHashes = new Map();
  for (const f of pkgFiles) {
    pkgHashes.set(f, sha256File(path.join(PKG_DIR, f)));
  }

  for (const [f, h] of pkgHashes) {
    const webNames = hashToWebNames.get(h) ?? [];
    const alias = webNames.filter((n) => n !== f);
    if (alias.length > 0 && webFiles.includes(f)) {
      console.warn(`⚠️  ${f} is byte-identical to web file(s): ${alias.join(", ")}`);
    }
  }

  if (pkgFiles.length !== webFiles.length) {
    console.warn(
      `⚠️  Count mismatch: web=${webFiles.length} mirror=${pkgFiles.length} (mirror should match after sync-from-web)`,
    );
    if (pkgFiles.length < webFiles.length) {
      failed = true;
      const missingInPkg = webFiles.filter((f) => !pkgFiles.includes(f));
      console.error("❌ Mirror missing web migrations:");
      for (const f of missingInPkg.slice(0, 20)) console.error(`   - ${f}`);
      if (missingInPkg.length > 20) console.error(`   … and ${missingInPkg.length - 20} more`);
      console.error("   Run: pnpm --filter @repo/database sync-from-web");
    }
  }

  if (failed) {
    console.error("\nMigration drift check failed. SSOT: apps/web/supabase/migrations\n");
    process.exit(1);
  }

  console.log(
    `✅ Migration mirror aligned (${webFiles.length} files, web SSOT apps/web/supabase/migrations)\n`,
  );
}

main();
