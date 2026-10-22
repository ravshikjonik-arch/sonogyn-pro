#!/usr/bin/env node
/**
 * Golden-set evaluation: rule engines on confirmed features (synthetic CI set + optional manifest).
 * Usage:
 *   node --import tsx scripts/imaging-cds-eval.mjs
 *   node --import tsx scripts/imaging-cds-eval.mjs --manifest docs/.../manifest.synthetic-ci.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { IMAGING_CDS_GOLDEN_CASES } from "./imaging-cds-golden-data.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const args = process.argv.slice(2);
const manifestIdx = args.indexOf("--manifest");
const writeManifestIdx = args.indexOf("--write-manifest");

let cases = IMAGING_CDS_GOLDEN_CASES;

if (manifestIdx !== -1 && args[manifestIdx + 1]) {
  const manifest = JSON.parse(readFileSync(args[manifestIdx + 1], "utf8"));
  if (!Array.isArray(manifest.cases) || manifest.cases.length === 0) {
    console.error("Manifest has no cases.");
    process.exit(2);
  }
  cases = manifest.cases;
}

if (writeManifestIdx !== -1 && args[writeManifestIdx + 1]) {
  const out = {
    version: 1,
    kind: "synthetic-feature-regression",
    description: "Expert-confirmed feature vectors for CI (no pixels). Pixel golden set is separate.",
    cases: IMAGING_CDS_GOLDEN_CASES,
  };
  writeFileSync(args[writeManifestIdx + 1], `${JSON.stringify(out, null, 2)}\n`);
  console.log("Wrote manifest:", args[writeManifestIdx + 1], out.cases.length, "cases");
}

const { calculateORADS } = await import(
  pathToFileURL(join(root, "packages/orads-us/src/pro/oradsCalculator.ts")).href
);
const { assistFromFreeText } = await import(
  pathToFileURL(join(root, "packages/birads-us/src/engine/nlp-assist.ts")).href
);

function parseBiradsHighRisk(categoryLabel) {
  return /BI-RADS\s*(4A|4B|4C|5|6)/i.test(String(categoryLabel));
}

function categoryMatches(actual, expectedPattern) {
  const a = String(actual);
  const e = String(expectedPattern);
  if (/^BI-RADS\s*4$/i.test(e)) return /BI-RADS\s*4/i.test(a);
  return new RegExp(e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(a);
}

let ok = 0;
let fail = 0;
const highRiskExpected = [];
const highRiskHit = [];

for (const c of cases) {
  if (c.domain === "gyn") {
    const result = calculateORADS(c.oradsInput);
    if (result.category !== c.expectedCategory) {
      console.error(`FAIL ${c.id}: expected O-RADS ${c.expectedCategory}, got ${result.category}`);
      fail += 1;
    } else {
      ok += 1;
    }
    if (c.expectedCategory >= 4) {
      highRiskExpected.push(c.id);
      if (result.category >= 4) highRiskHit.push(c.id);
    }
  } else if (c.domain === "breast") {
    const result = assistFromFreeText(c.freeText);
    const cat = result.report.engine.category;
    if (!categoryMatches(cat, c.expectedCategoryPattern)) {
      console.error(`FAIL ${c.id}: expected ${c.expectedCategoryPattern}, got ${cat}`);
      fail += 1;
    } else {
      ok += 1;
    }
    if (parseBiradsHighRisk(c.expectedCategoryPattern)) {
      highRiskExpected.push(c.id);
      if (parseBiradsHighRisk(cat)) highRiskHit.push(c.id);
    }
  } else {
    console.error(`FAIL ${c.id}: unknown domain`);
    fail += 1;
  }
}

const highRiskSens =
  highRiskExpected.length > 0 ? highRiskHit.length / highRiskExpected.length : 1;

console.log(
  JSON.stringify({
    cases: cases.length,
    pass: ok,
    fail,
    highRiskSensitivity: Number(highRiskSens.toFixed(3)),
  }),
);

if (fail > 0) process.exit(1);
if (cases.length < 30) {
  console.error("Need at least 30 cases for CDS golden gate.");
  process.exit(1);
}
process.exit(0);
