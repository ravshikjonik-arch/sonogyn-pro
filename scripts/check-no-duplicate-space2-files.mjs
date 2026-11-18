#!/usr/bin/env node
/**
 * Guard against macOS/iCloud "foo 2.tsx" duplicate artifacts.
 * Fails CI if any such file exists under apps/ or packages/ (excl. node_modules/.next).
 */
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const ROOTS = ["apps", "packages"];
const SKIP = new Set(["node_modules", ".next", "dist", "build", "coverage"]);
const PATTERN = / 2\.[^/]+$/;

/** @type {string[]} */
const hits = [];

/**
 * @param {string} dir
 */
function walk(dir) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (entry.isFile() && PATTERN.test(entry.name)) {
      hits.push(relative(ROOT, full));
    }
  }
}

for (const root of ROOTS) {
  const abs = join(ROOT, root);
  try {
    if (statSync(abs).isDirectory()) walk(abs);
  } catch {
    // missing root — skip
  }
}

if (hits.length > 0) {
  console.error(`Found ${hits.length} duplicate "* 2.*" file(s). Remove them before merge:\n`);
  for (const h of hits.slice(0, 80)) console.error(`  - ${h}`);
  if (hits.length > 80) console.error(`  … and ${hits.length - 80} more`);
  process.exit(1);
}

console.log('OK: no "* 2.*" duplicate files under apps/ packages/');
