#!/usr/bin/env node
/** Load apps/web/.env.local then run embed-medical-vault-chunks.mjs (no secret printing). */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const envPath = join(dir, "../.env.local");
const env = { ...process.env };
for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#") || !t.includes("=")) continue;
  const i = t.indexOf("=");
  const k = t.slice(0, i);
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[k] = v;
}
env.EMBED_LIMIT = process.env.EMBED_LIMIT || "250";
const r = spawnSync(process.execPath, [join(dir, "embed-medical-vault-chunks.mjs")], {
  env,
  stdio: "inherit",
  cwd: join(dir, ".."),
});
process.exit(r.status ?? 1);
