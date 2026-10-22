/**
 * Копирует 96 JPEG из docs/fetometry-source/medvedev-archive (или Desktop Архив.zip)
 * в apps/web/public/clinical/medvedev-archive для prod/preview.
 *
 * Usage:
 *   node packages/medvedev-reference/scripts/sync-archive-images-to-web.mjs
 *   ARCHIVE_ZIP=/path/Архив.zip node ...
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dir, "../../..");
const catalogPath = path.join(repoRoot, "packages/medvedev-reference/data/archive-tables/catalog.json");
const defaultSrc = path.join(repoRoot, "docs/fetometry-source/medvedev-archive");
const destDir = path.join(repoRoot, "apps/web/public/clinical/medvedev-archive");
const desktopZip = path.join(process.env.HOME ?? "", "Desktop", "Архив.zip");

const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
const needed = new Set(catalog.cards.map((c) => c.filename));

function ensureFromZip(zipPath, tmpDir) {
  fs.mkdirSync(tmpDir, { recursive: true });
  execFileSync("unzip", ["-o", "-q", zipPath, "*.jpeg", "-d", tmpDir], { stdio: "inherit" });
}

function resolveSourceDir() {
  const envZip = process.env.ARCHIVE_ZIP;
  if (envZip && fs.existsSync(envZip)) {
    const tmp = path.join(repoRoot, ".tmp/medvedev-archive-unpack");
    ensureFromZip(envZip, tmp);
    return tmp;
  }
  if (fs.existsSync(defaultSrc)) {
    const jpegs = fs.readdirSync(defaultSrc).filter((f) => f.endsWith(".jpeg"));
    if (jpegs.length >= catalog.totalCards) return defaultSrc;
  }
  if (fs.existsSync(desktopZip)) {
    const tmp = path.join(repoRoot, ".tmp/medvedev-archive-unpack");
    ensureFromZip(desktopZip, tmp);
    return tmp;
  }
  throw new Error(
    `Нет JPEG: положите Архив.zip на Desktop или распакуйте в ${defaultSrc}`,
  );
}

const srcDir = resolveSourceDir();
fs.mkdirSync(destDir, { recursive: true });

let copied = 0;
const missing = [];
for (const name of needed) {
  const from = path.join(srcDir, name);
  const to = path.join(destDir, name);
  if (!fs.existsSync(from)) {
    missing.push(name);
    continue;
  }
  fs.copyFileSync(from, to);
  copied++;
}

if (missing.length) {
  console.error("Missing JPEG:", missing.slice(0, 5).join(", "), missing.length > 5 ? `… +${missing.length - 5}` : "");
  process.exit(1);
}

console.log(`Medvedev archive images: ${copied}/${needed.size} → ${destDir}`);
