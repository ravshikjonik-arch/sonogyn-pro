import assert from "node:assert/strict";
import test from "node:test";

import { assistFromFreeText } from "./nlp-assist";
import { mergeParsedBiradsInput, presetForPathology } from "./merge-input";

test("assistFromFreeText: fibroadenoma pattern → BI-RADS 3", () => {
  const text =
    "Овальное гипоэхогенное образование 12×8 мм, параллельное, чёткие контуры, усиление сзади";
  const result = assistFromFreeText(text);
  assert.match(result.report.engine.category, /BI-RADS 3/i);
  assert.equal(result.parsedInput.shape, "oval");
  assert.equal(result.parsedInput.echoPattern, "hypoechoic");
  assert.equal(result.parsedInput.margin, "circumscribed");
  assert.match(result.parsedInput.localizationText ?? "", /12×8/);
});

test("presetForPathology: simple cyst", () => {
  const preset = presetForPathology("simple_cyst");
  assert.ok(preset);
  const merged = mergeParsedBiradsInput(preset!);
  assert.equal(merged.specialCase, "simple_cyst");
  assert.equal(merged.echoPattern, "anechoic");
});
