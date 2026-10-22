import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { generateCalculatorReport, REPORT_GENERATOR_DISCLAIMER_RU } from "./index";

const here = dirname(fileURLToPath(import.meta.url));

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, name.name);
    if (name.isDirectory()) out.push(...collectTsFiles(p));
    else if (name.name.endsWith(".ts") && !name.name.endsWith(".test.ts")) out.push(p);
  }
  return out;
}

test("templates must not contain the word диагноз", () => {
  const root = join(here, "templates");
  const files = collectTsFiles(root);
  const forbidden = /диагноз/i;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    assert.equal(forbidden.test(text), false, `Forbidden wording in ${file}`);
  }
});

test("bishop report includes mandatory disclaimer", () => {
  const report = generateCalculatorReport({
    toolId: "bishop",
    inputs: { dilation: 2, effacement: 2, station: 1, consistency: 1, position: 1 },
    outputs: {},
    timestamp: new Date(0).toISOString(),
  });
  assert.ok(report.plainText.includes(REPORT_GENERATOR_DISCLAIMER_RU));
  assert.equal(report.disclaimer, REPORT_GENERATOR_DISCLAIMER_RU);
});

test("efw hadlock report lists grams when biometry present", () => {
  const report = generateCalculatorReport({
    toolId: "fetal-weight",
    inputs: { tab: "hadlock", bpd: "90", hc: "300", ac: "280", fl: "65" },
    outputs: {},
    timestamp: new Date(0).toISOString(),
  });
  assert.match(report.plainText, /\d+\s*г/);
});
