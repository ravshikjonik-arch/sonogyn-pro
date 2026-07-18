import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Vector3 } from "three";

import {
  computeFibroidClinicalMetrics,
  depthToComponentPercents,
  suggestFigoAlternatives,
} from "./clinicalFibroidLogic";
import { analyzeUterusHit, figoEducationalBucket } from "./figoHitMapping";
import { figoFromLesionEllipse } from "./sliceLesionShape";
import { figoFromStroke, figoVariantFromStroke } from "./sliceStrokeAnalysis";

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

  it("intramural lesion near cavity but without endometrial contact maps to FIGO 4", () => {
    const figo = figoFromLesionEllipse({ cx: 0.29, cy: 0.33, rx: 0.075, ry: 0.035, rotation: 0 }, false);
    assert.equal(figo, 4);
  });

  it("drawn intramural zone near cavity but without contact maps to FIGO 4", () => {
    const figo = figoFromStroke(
      [
        [0.21, 0.32],
        [0.24, 0.29],
        [0.32, 0.29],
        [0.38, 0.32],
        [0.35, 0.36],
        [0.25, 0.36],
        [0.21, 0.32],
      ],
      false,
    );
    assert.equal(figo, 4);
  });

  it("intramural lesion touching endometrium maps to FIGO 3", () => {
    const figo = figoFromLesionEllipse({ cx: 0.29, cy: 0.35, rx: 0.075, ry: 0.055, rotation: 0 }, false);
    assert.equal(figo, 3);
  });

  it("upper-wall intramural lesion touching serosa maps to FIGO 5", () => {
    const figo = figoFromLesionEllipse({ cx: 0.34, cy: 0.3, rx: 0.08, ry: 0.085, rotation: 0 }, false);
    assert.equal(figo, 5);
  });

  it("lower-wall intramural lesion touching serosa maps to FIGO 5", () => {
    const figo = figoFromLesionEllipse({ cx: 0.36, cy: 0.62, rx: 0.08, ry: 0.085, rotation: 0 }, false);
    assert.equal(figo, 5);
  });

  it("drawn serosal-contact zone does not get downgraded to FIGO 2", () => {
    const figo = figoFromStroke(
      [
        [0.27, 0.3],
        [0.3, 0.22],
        [0.39, 0.22],
        [0.44, 0.3],
        [0.4, 0.38],
        [0.3, 0.38],
        [0.27, 0.3],
      ],
      false,
    );
    assert.equal(figo, 5);
  });

  it("transmural stroke with submucosal and subserosal contact can be FIGO 2-5", () => {
    const points: [number, number][] = [
      [0.28, 0.39],
      [0.32, 0.25],
      [0.4, 0.22],
      [0.48, 0.4],
      [0.43, 0.57],
      [0.34, 0.54],
      [0.28, 0.39],
    ];
    const figo = figoFromStroke(points, false);
    const variant = figoVariantFromStroke(points, figo);
    assert.equal(figo, 2);
    assert.equal(variant, "2-5");
  });
});
