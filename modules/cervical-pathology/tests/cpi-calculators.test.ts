import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  analyzeColposcopyImage,
  mergeAiIfcpcPredictions,
  setAiColposcopyProvider,
} from "../src/ai/colposcopy-service";
import {
  UnconfiguredAiColposcopyProvider,
  type ImageAnalysisProvider,
  type AiColposcopyAnalysis,
} from "../src/ai/providers";
import { evaluateHpvRisk, hpvToLegacyFlags } from "../src/calculators/hpv-engine";
import { buildIfcpcProtocol } from "../src/calculators/ifcpc-engine";
import { calculateQualityScore } from "../src/calculators/risk-engine";
import { evaluateSwedeScore } from "../src/calculators/swede-engine";
import { CpiCaseInputSchema } from "../src/domain/schemas";

describe("CPI — HPV engine edge cases", () => {
  it("HPV negative returns very_low", () => {
    const r = evaluateHpvRisk({ status: "negative", genotypes: ["negative"], viralLoad: "not_available", persistent: false });
    assert.equal(r.band, "very_low");
    assert.ok(r.cin2plusModifier < 0);
  });

  it("hpvToLegacyFlags maps genotypes", () => {
    const f = hpvToLegacyFlags({
      status: "positive",
      genotypes: ["hpv31", "hpv52"],
      viralLoad: "low",
      persistent: false,
    });
    assert.equal(f.hpv3133455258Positive, true);
    assert.equal(f.hpv16Positive, false);
  });
});

describe("CPI — Swede & IFCPC", () => {
  it("Swede score totals correctly", () => {
    const r = evaluateSwedeScore({ acetowhite: 2, margins: 1, vessels: 1, lesionSize: 1, iodine: 1 });
    assert.equal(r.total, 6);
  });

  it("buildIfcpcProtocol includes TZ line", () => {
    const text = buildIfcpcProtocol({
      adequacyId: "adequacy_satisfactory",
      scjVisibilityId: "scj_completely_visible",
      transformationZoneTypeId: "tz1",
      findingSignIds: ["thin_acetowhite"],
    });
    assert.match(text.protocolText, /IFCPC/);
    assert.ok(text.conclusion.length > 10);
  });
});

describe("CPI — quality incomplete tier", () => {
  it("scores below 50 as Incomplete", () => {
    const q = calculateQualityScore({
      scjDocumented: false,
      tzDocumented: false,
      aceticAcidAssessment: false,
      iodineTestPerformed: false,
      lesionDocumented: false,
      photoPreAcetic: false,
      photoPostAcetic: false,
      photoPostSchiller: false,
      adequacyDocumented: false,
    });
    assert.equal(q.score, 0);
    assert.match(q.interpretation, /Incomplete/);
  });
});

describe("CPI — AI colposcopy service", () => {
  beforeEach(() => {
    setAiColposcopyProvider(null);
  });

  it("returns unconfigured when env URL absent", async () => {
    const r = await analyzeColposcopyImage(
      { imageUrl: "https://example.com/a.jpg", caseId: "00000000-0000-4000-8000-000000000001" },
      {},
    );
    assert.equal(r.configured, false);
    assert.equal(r.providerId, "unconfigured");
    assert.equal(r.analysis.cin2PlusProbability, null);
  });

  it("mergeAiIfcpcPredictions respects threshold", () => {
    const analysis: AiColposcopyAnalysis = {
      providerId: "test",
      analyzedAt: new Date().toISOString(),
      lesionMask: null,
      heatmapUrl: null,
      ifcpcPredictions: [
        { signId: "dense_acetowhite", probability: 0.9 },
        { signId: "fine_punctation", probability: 0.3 },
      ],
      cin2PlusProbability: 0.4,
      cin3PlusProbability: 0.2,
      modelVersion: "v0",
    };
    const merged = mergeAiIfcpcPredictions(["thin_acetowhite"], analysis, 0.5);
    assert.deepEqual(merged.sort(), ["dense_acetowhite", "thin_acetowhite"].sort());
  });

  it("uses injected provider", async () => {
    const stub: ImageAnalysisProvider = {
      id: "stub",
      async analyzeImage() {
        return {
          providerId: "stub",
          analyzedAt: new Date().toISOString(),
          lesionMask: null,
          heatmapUrl: "https://example.com/h.png",
          ifcpcPredictions: [{ signId: "coarse_mosaic", probability: 0.8 }],
          cin2PlusProbability: 0.35,
          cin3PlusProbability: 0.12,
          modelVersion: "test-1",
        };
      },
    };
    setAiColposcopyProvider(stub);
    const r = await analyzeColposcopyImage({
      imageUrl: "https://example.com/x.jpg",
      caseId: "00000000-0000-4000-8000-000000000002",
    });
    assert.equal(r.configured, true);
    assert.equal(r.analysis.heatmapUrl, "https://example.com/h.png");
    setAiColposcopyProvider(new UnconfiguredAiColposcopyProvider());
  });
});

describe("CPI — schema validation failures", () => {
  it("rejects invalid age", () => {
    const r = CpiCaseInputSchema.safeParse({
      colposcopy: {
        adequacyId: "adequacy_satisfactory",
        scjVisibilityId: "scj_completely_visible",
        transformationZoneTypeId: "tz1",
        findingSignIds: [],
      },
      hpv: { status: "negative", genotypes: ["negative"], viralLoad: "not_available", persistent: false },
      cytology: { result: "nilm" },
      histology: { result: "none" },
      clinical: {
        age: 5,
        pregnancy: false,
        immunosuppression: false,
        smoking: false,
        priorCinTreatment: "none",
        glandularSuspicion: "none",
        suspectedGlandularLesion: false,
      },
    });
    assert.equal(r.success, false);
  });
});
