import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Vector3 } from "three";

import {
  computeFibroidClinicalMetrics,
  depthToComponentPercents,
  suggestFigoAlternatives,
} from "./clinicalFibroidLogic";
import { analyzeUterusHit, figoEducationalBucket } from "./figoHitMapping";

describe("figoClassifier", () => {
  it("submucosal depth maps to FIGO 1–2 bucket", () => {
    const hit = analyzeUterusHit(new Vector3(0.02, 0.35, 0.28), false);
    assert.ok(hit.figoType <= 2);
    assert.equal(figoEducationalBucket(hit.figoType), "Субмукозная");
  });

  it("deep intramural maps to FIGO 4", () => {
    const hit = analyzeUterusHit(new Vector3(0.35, 0.1, 0.55), false);
    assert.ok(hit.figoType >= 3 && hit.figoType <= 5);
  });

  it("cervical y maps to FIGO 8", () => {
    const hit = analyzeUterusHit(new Vector3(0, -1.4, 0.3), false);
    assert.equal(hit.figoType, 8);
  });

  it("component percents sum to 100", () => {
    const p = depthToComponentPercents(0.45);
    assert.equal(p.submucosalPct + p.intramuralPct + p.subserosalPct, 100);
  });

  it("suggestFigoAlternatives returns neighbors", () => {
    const alt = suggestFigoAlternatives(4);
    assert.ok(alt.includes(4));
    assert.ok(alt.length >= 2);
  });

  it("computeFibroidClinicalMetrics includes localization", () => {
    const m = computeFibroidClinicalMetrics(new Vector3(0.1, 0.5, 0.6), false);
    assert.ok(m.localizationRu.includes("стенк") || m.localizationRu.includes("дно"));
    assert.ok(m.summaryRu.includes("FIGO"));
  });
});
