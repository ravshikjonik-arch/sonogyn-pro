import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAcrTirads } from "./score";
import { presetToInput } from "./engine/structured-report";
import { THYROID_PATTERN_LIBRARY } from "./knowledge/patterns";
import { assistFromTiradsText } from "./engine/nlp-assist";

test("PTC pattern → TR5", () => {
  const input = presetToInput("papillary_carcinoma", THYROID_PATTERN_LIBRARY)!;
  const r = evaluateAcrTirads({ ...input, largestDiameterMm: 12 });
  assert.equal(r.category, "TR5");
  assert.equal(r.fnaRecommended, true);
});

test("colloid pattern → TR2", () => {
  const input = presetToInput("colloid_nodule", THYROID_PATTERN_LIBRARY)!;
  const r = evaluateAcrTirads(input);
  assert.equal(r.category, "TR2");
  assert.equal(r.totalPoints, 1);
});

test("NLP papillary text", () => {
  const r = assistFromTiradsText(
    "Солидный очень гипоэхогенный узел, taller-than-wide, микрокальцинаты, неровные контуры, 11 мм",
  );
  assert.match(r.report.result.category, /TR5/);
});
