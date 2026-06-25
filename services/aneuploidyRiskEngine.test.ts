import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assessAneuploidyRisk } from "./aneuploidyRiskEngine";

describe("assessAneuploidyRisk — first trimester", () => {
  it("elevates T21 risk with NT + absent nasal bone at age 35", () => {
    const out = assessAneuploidyRisk({
      maternalAgeYears: 35,
      gestationalAge: { weeks: 12 },
      crlMm: 60,
      ntMm: 4.0,
      nasalBone: "absent",
    });

    assert.equal(out.trimester, "first");
    assert.ok(out.activeMarkers.includes("increased_nt"));
    assert.ok(out.activeMarkers.includes("absent_nasal_bone"));
    assert.ok(out.markerScore >= 2);
    assert.equal(out.risks[0].pathologyId, "trisomy-21");
    assert.ok(out.risks[0].posteriorRisk > out.risks[0].priorRisk);
    assert.ok(out.riskLevel === "high" || out.riskLevel === "intermediate");
  });

  it("returns low risk for young patient without markers", () => {
    const out = assessAneuploidyRisk({
      maternalAgeYears: 28,
      gestationalAge: { weeks: 12 },
      crlMm: 58,
      ntMm: 1.5,
      nasalBone: "present",
      dvFlow: "normal",
      tricuspidRegurgitation: "none",
    });

    assert.equal(out.riskLevel, "low");
    assert.equal(out.markerScore, 0);
    assert.ok(out.risks[0].posteriorRisk < 1 / 100);
  });
});

describe("assessAneuploidyRisk — multiple markers", () => {
  it("boosts T18 with high NT and TR", () => {
    const out = assessAneuploidyRisk({
      maternalAgeYears: 32,
      gestationalAge: { weeks: 13 },
      ntMm: 5.5,
      tricuspidRegurgitation: "present",
      dvFlow: "abnormal",
    });

    const t18 = out.risks.find((r) => r.pathologyId === "trisomy-18");
    const t21 = out.risks.find((r) => r.pathologyId === "trisomy-21");
    assert.ok(t18);
    assert.ok(t21);
    assert.ok(t18!.likelihoodRatioProduct >= t21!.likelihoodRatioProduct * 0.5);
    assert.ok(out.riskLevel !== "low");
  });
});

describe("assessAneuploidyRisk — second trimester soft markers", () => {
  it("detects soft markers from findings text", () => {
    const out = assessAneuploidyRisk({
      maternalAgeYears: 30,
      gestationalAge: { weeks: 20 },
      findings: ["Эхогенный кишечник", "Эхогенный фокус в сердце"],
    });

    assert.equal(out.trimester, "second");
    assert.ok(out.activeMarkers.includes("echogenic_bowel"));
    assert.ok(out.activeMarkers.includes("echogenic_focus"));
  });
});
