#!/usr/bin/env node
/**
 * Ensures O-RADS decision tree node set matches committed snapshot (CI drift guard).
 * Run with: node --import tsx packages/orads-us/scripts/verify-decision-tree-snapshot.mjs
 * Update snapshot: ... --write
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const snapshotPath = join(here, "../rules/orads-decision-tree.snapshot.json");

const { ORADS_DECISION_TREE, ORADS_TREE_ROOT_ID } = await import(
  pathToFileURL(join(here, "../src/oradsDecisionTree.ts")).href
);

const nodeIds = Object.keys(ORADS_DECISION_TREE).sort();
const hash = createHash("sha256").update(nodeIds.join("|")).digest("hex");

const live = {
  system: "o-rads-us",
  version: "v2022",
  rootId: ORADS_TREE_ROOT_ID,
  nodeCount: nodeIds.length,
  nodeIdsHash: hash,
  nodeIds,
};

if (process.argv.includes("--write")) {
  writeFileSync(snapshotPath, `${JSON.stringify(live, null, 2)}\n`);
  console.log("Wrote snapshot", snapshotPath, live.nodeCount, "nodes");
  process.exit(0);
}

if (!existsSync(snapshotPath)) {
  console.error("Missing snapshot. Run with --write first.");
  process.exit(1);
}

const committed = JSON.parse(readFileSync(snapshotPath, "utf8"));

if (committed.nodeIdsHash !== live.nodeIdsHash || committed.nodeCount !== live.nodeCount) {
  console.error("O-RADS decision tree snapshot drift.");
  console.error("Committed:", committed.nodeIdsHash, committed.nodeCount);
  console.error("Live:", live.nodeIdsHash, live.nodeCount);
  process.exit(1);
}

console.log("O-RADS tree snapshot OK:", live.nodeCount, "nodes");
