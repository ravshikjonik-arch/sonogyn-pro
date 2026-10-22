#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const rulesPath = join(here, "../src/rules.birads.json");
const snapshotPath = join(here, "../rules/birads-rules.snapshot.json");

const rulesDoc = JSON.parse(readFileSync(rulesPath, "utf8"));
const ruleIds = (rulesDoc.rules ?? []).map((r) => r.id).sort();
const hash = createHash("sha256").update(ruleIds.join("|")).digest("hex");

const live = {
  system: "birads-us",
  version: rulesDoc.version ?? "unknown",
  ruleCount: ruleIds.length,
  ruleIdsHash: hash,
  ruleIds,
};

if (process.argv.includes("--write")) {
  writeFileSync(snapshotPath, `${JSON.stringify(live, null, 2)}\n`);
  console.log("Wrote", snapshotPath, live.ruleCount, "rules");
  process.exit(0);
}

if (!existsSync(snapshotPath)) {
  console.error("Missing snapshot. Run with --write");
  process.exit(1);
}

const committed = JSON.parse(readFileSync(snapshotPath, "utf8"));
if (committed.ruleIdsHash !== live.ruleIdsHash) {
  console.error("BI-RADS rules snapshot drift.");
  process.exit(1);
}
console.log("BI-RADS rules snapshot OK:", live.ruleCount);
