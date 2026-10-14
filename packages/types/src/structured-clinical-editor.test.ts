import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CALCULATOR_ALGORITHM_CATALOG,
  StructuredCalculatorBlockSchema,
  StructuredCaseDocumentSchema,
  emptyStructuredCaseDocument,
  emptyStructuredProtocolDraft,
} from "./structured-clinical-editor";

describe("emptyStructuredCaseDocument", () => {
  it("creates all 13 case sections", () => {
    const doc = emptyStructuredCaseDocument();
    assert.equal(Object.keys(doc.sections).length, 13);
    assert.equal(doc.templateVersion, "case-v1");
    assert.equal(doc.physicianConfirmedConclusion, false);
  });
});

describe("emptyStructuredProtocolDraft", () => {
  it("creates all 8 protocol sections", () => {
    const draft = emptyStructuredProtocolDraft();
    assert.equal(Object.keys(draft.sections).length, 8);
    assert.equal(draft.templateVersion, "protocol-v1");
  });
});

describe("StructuredCalculatorBlockSchema", () => {
  it("requires immutable flag", () => {
    const block = StructuredCalculatorBlockSchema.parse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      system: "O-RADS",
      category: "O-RADS 4",
      summary: "Кистозно-солидное образование",
      algorithmId: CALCULATOR_ALGORITHM_CATALOG["O-RADS"].algorithmId,
      algorithmVersion: "2022",
      sourceLabel: CALCULATOR_ALGORITHM_CATALOG["O-RADS"].sourceLabel,
      insertedAt: new Date().toISOString(),
      immutable: true,
    });
    assert.equal(block.immutable, true);
  });
});

describe("StructuredCaseDocumentSchema", () => {
  it("parses empty document", () => {
    const parsed = StructuredCaseDocumentSchema.safeParse(emptyStructuredCaseDocument());
    assert.equal(parsed.success, true);
  });
});
