import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sanitizeVisionForRuleEngine } from "@/lib/ai/imaging-cds/sanitize-vision-result";
import type { UsVisionAnalysisResult } from "@/lib/ai/us-vision/types";

function sampleVision(): UsVisionAnalysisResult {
  return {
    modelVersion: "test",
    pipeline: "test",
    locale: "ru",
    disclaimer: "assistive",
    studySummary: "киста",
    impression: "O-RADS 4 подозрение",
    recommendations: [],
    scorecard: "BI-RADS 4A",
    mediaIds: ["00000000-0000-4000-8000-000000000001"],
    frames: [
      {
        mediaId: "00000000-0000-4000-8000-000000000001",
        findings: ["однокамерная"],
        scanErrors: [],
        biometryHints: [],
        confidence: 0.5,
        orads: "4",
        birads: "4A",
      },
    ],
  };
}

describe("imaging-cds sanitize", () => {
  it("strips frame orads/birads and neutralizes scorecard categories", () => {
    const out = sanitizeVisionForRuleEngine(sampleVision());
    assert.equal(out.frames[0]?.orads, undefined);
    assert.equal(out.frames[0]?.birads, undefined);
    assert.ok(out.scorecard?.includes("калькулятора"));
    assert.doesNotMatch(out.impression, /O-RADS\s*4/i);
    assert.match(out.pipeline, /cds-sanitize/);
  });
});
