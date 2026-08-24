import assert from "node:assert/strict";
import test from "node:test";

import { evaluateAcrTirads } from "./score";
import { presetToInput } from "./engine/structured-report";
import { THYROID_PATTERN_LIBRARY } from "./knowledge/patterns";
import { assistFromTiradsText } from "./engine/nlp-assist";
import type { TiradsAcrInput } from "./types";

test("PTC pattern → TR5", () => {
  const input = presetToInput("papillary_carcinoma", THYROID_PATTERN_LIBRARY)!;
  const r = evaluateAcrTirads({ ...input, largestDiameterMm: 12 });
  assert.equal(r.category, "TR5");
  assert.equal(r.fnaRecommended, true);
});

test("colloid / spongiform pattern → TR1 (ACR benign composition)", () => {
  const input = presetToInput("colloid_nodule", THYROID_PATTERN_LIBRARY)!;
  const r = evaluateAcrTirads(input);
  assert.equal(r.category, "TR1");
  assert.equal(r.totalPoints, 0);
});

test("cystic → TR1 shortcut (ignore other features)", () => {
  const r = evaluateAcrTirads({
    composition: "cystic",
    echogenicity: "very_hypoechoic",
    shape: "taller_than_wide",
    margin: "extrathyroidal_extension",
    echogenicFoci: ["punctate"],
    largestDiameterMm: 30,
  });
  assert.equal(r.category, "TR1");
  assert.equal(r.totalPoints, 0);
  assert.equal(r.fnaRecommended, false);
});

test("spongiform → TR1", () => {
  const r = evaluateAcrTirads({
    composition: "spongiform",
    echogenicity: "hyperechoic_or_isoechoic",
    shape: "wider_than_tall",
    margin: "smooth",
    echogenicFoci: ["none_or_comet_tail"],
  });
  assert.equal(r.category, "TR1");
});

test("0 points → TR1; 3–4 → TR3; 5–6 → TR4; ≥7 → TR5", () => {
  const base: TiradsAcrInput = {
    composition: "mixed", // 1
    echogenicity: "anechoic", // 0
    shape: "wider_than_tall", // 0
    margin: "smooth", // 0
    echogenicFoci: ["none_or_comet_tail"], // 0 → total 1 → TR2
  };
  assert.equal(evaluateAcrTirads(base).category, "TR2");

  // solid(2)+iso(1)=3 → TR3
  assert.equal(
    evaluateAcrTirads({
      ...base,
      composition: "solid",
      echogenicity: "hyperechoic_or_isoechoic",
    }).category,
    "TR3",
  );

  // solid(2)+hypo(2)=4 → TR3
  assert.equal(
    evaluateAcrTirads({
      ...base,
      composition: "solid",
      echogenicity: "hypoechoic",
    }).category,
    "TR3",
  );

  // solid(2)+hypo(2)+macro(1)=5 → TR4
  assert.equal(
    evaluateAcrTirads({
      ...base,
      composition: "solid",
      echogenicity: "hypoechoic",
      echogenicFoci: ["macrocalcifications"],
    }).category,
    "TR4",
  );

  // solid(2)+hypo(2)+taller(3)=7 → TR5
  assert.equal(
    evaluateAcrTirads({
      ...base,
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "taller_than_wide",
      echogenicFoci: ["punctate"],
    }).category,
    "TR5",
  );
});

test("multi-foci points are summed", () => {
  const r = evaluateAcrTirads({
    composition: "mixed", // 1
    echogenicity: "anechoic",
    shape: "wider_than_tall",
    margin: "smooth",
    echogenicFoci: ["macrocalcifications", "peripheral_rim"], // 1+2=3 → total 4 → TR3
  });
  assert.equal(r.scoreBreakdown.echogenicFoci, 3);
  assert.equal(r.totalPoints, 4);
  assert.equal(r.category, "TR3");
});

test("FNA thresholds TR3≥25 TR4≥15 TR5≥10", () => {
  const tr3 = {
    composition: "solid" as const,
    echogenicity: "hyperechoic_or_isoechoic" as const,
    shape: "wider_than_tall" as const,
    margin: "smooth" as const,
    echogenicFoci: ["none_or_comet_tail" as const],
  };
  assert.equal(evaluateAcrTirads({ ...tr3, largestDiameterMm: 24 }).fnaRecommended, false);
  assert.equal(evaluateAcrTirads({ ...tr3, largestDiameterMm: 25 }).fnaRecommended, true);

  const tr4 = {
    composition: "solid" as const,
    echogenicity: "hypoechoic" as const,
    shape: "wider_than_tall" as const,
    margin: "smooth" as const,
    echogenicFoci: ["macrocalcifications" as const],
  };
  assert.equal(evaluateAcrTirads({ ...tr4, largestDiameterMm: 14 }).fnaRecommended, false);
  assert.equal(evaluateAcrTirads({ ...tr4, largestDiameterMm: 15 }).fnaRecommended, true);

  const tr5 = {
    composition: "solid" as const,
    echogenicity: "hypoechoic" as const,
    shape: "taller_than_wide" as const,
    margin: "smooth" as const,
    echogenicFoci: ["punctate" as const],
  };
  assert.equal(evaluateAcrTirads({ ...tr5, largestDiameterMm: 9 }).fnaRecommended, false);
  assert.equal(evaluateAcrTirads({ ...tr5, largestDiameterMm: 10 }).fnaRecommended, true);
});

test("NLP papillary text", () => {
  const r = assistFromTiradsText(
    "Солидный очень гипоэхогенный узел, taller-than-wide, микрокальцинаты, неровные контуры, 11 мм",
  );
  assert.match(r.report.result.category, /TR5/);
});
