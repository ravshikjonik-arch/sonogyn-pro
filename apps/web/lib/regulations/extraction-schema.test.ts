import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { regulationExtractionEnvelopeSchema } from "./extraction-schema";

describe("regulationExtractionEnvelopeSchema", () => {
  it("accepts minimal valid envelope", () => {
    const parsed = regulationExtractionEnvelopeSchema.parse({
      confidence: "medium",
      draft: {
        title: "КР: ведение беременности",
        summary: "Краткая выдержка для платформы SonoGyn Pro по акушерскому скринингу.",
        shelf: "kr_mz_rf",
        documentKind: "clinical_recommendation",
        issuer: "mz_rf",
        specialty: "obstetrics",
        recommendations: [
          {
            clinical_guideline: "Сроки скрининга по протоколу",
            evidence_level: "B",
            applicable_to: ["fetometry-norms"],
          },
        ],
      },
    });
    assert.equal(parsed.draft.shelf, "kr_mz_rf");
  });

  it("rejects empty summary", () => {
    assert.throws(() =>
      regulationExtractionEnvelopeSchema.parse({
        confidence: "low",
        draft: {
          title: "X",
          summary: "short",
          shelf: "kr_mz_rf",
          documentKind: "order",
          issuer: "mz_rf",
          specialty: "general",
        },
      }),
    );
  });
});
