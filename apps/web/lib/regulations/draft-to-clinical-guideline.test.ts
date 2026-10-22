import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { draftEnvelopeToClinicalGuideline } from "./draft-to-clinical-guideline";
import { regulationExtractionEnvelopeSchema } from "./extraction-schema";

describe("draftEnvelopeToClinicalGuideline", () => {
  it("maps draft to ClinicalGuideline with sections", () => {
    const envelope = regulationExtractionEnvelopeSchema.parse({
      confidence: "high",
      draft: {
        title: "Приказ: скрининг I триместра",
        summary: "Выдержка для SonoGyn Pro по срокам скрининга и протоколу УЗИ.",
        shelf: "orders_mz_rf",
        documentKind: "order",
        issuer: "mz_rf",
        specialty: "obstetrics",
        year: 2025,
        officialUrl: "https://example.com/doc",
        recommendations: [{ clinical_guideline: "Срок 11–13+6", evidence_level: "A", applicable_to: [] }],
        relevantSections: ["Скрининг"],
      },
    });
    const g = draftEnvelopeToClinicalGuideline(envelope, {
      queueId: "550e8400-e29b-41d4-a716-446655440000",
      sourceUrl: "https://example.com/doc",
    });
    assert.ok(g.id.startsWith("ingest-"));
    assert.equal(g.shelf, "orders_mz_rf");
    assert.equal(g.sections?.length, 2);
  });
});
