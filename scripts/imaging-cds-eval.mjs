#!/usr/bin/env node
/**
 * Golden-set evaluation skeleton for clinical imaging CDS.
 * Usage: node scripts/imaging-cds-eval.mjs --manifest docs/clinical-imaging-cds/golden-set/manifest.example.json
 *
 * Requires labeled cases (features + physician-confirmed category). Does not invent data.
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const manifestIdx = args.indexOf("--manifest");
if (manifestIdx === -1 || !args[manifestIdx + 1]) {
  console.error("Provide --manifest path to JSON list of cases.");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(args[manifestIdx + 1], "utf8"));
if (!Array.isArray(manifest.cases) || manifest.cases.length === 0) {
  console.error("Manifest has no cases — add expert-labeled images before running metrics.");
  process.exit(2);
}

console.log("imaging-cds-eval: manifest cases:", manifest.cases.length);
console.log("TODO: call rule engines on confirmed features; compare to labels; output κ / high-risk sensitivity.");
process.exit(0);
