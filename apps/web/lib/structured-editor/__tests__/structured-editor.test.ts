import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { StructuredCalculatorBlock } from "@repo/types";
import { emptyStructuredCaseDocument } from "@repo/types";

import { sanitizeClinicalHtml } from "@/lib/clinical-editor/sanitize-clinical-html";
import {
  appendAiDraftHtml,
  mergeCalculatorBlocks,
  sanitizeStructuredSection,
} from "@/lib/structured-editor/document-sanitize";
import { buildCaseSearchText } from "@/lib/structured-editor/search-text";

const BLOCK: StructuredCalculatorBlock = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  system: "O-RADS",
  category: "O-RADS 4",
  summary: "Кистозно-солидное",
  algorithmId: "orads-v2022",
  algorithmVersion: "2022",
  sourceLabel: "ACR O-RADS",
  insertedAt: "2026-01-01T00:00:00.000Z",
  immutable: true,
  isAiDraft: false,
};

describe("sanitizeStructuredSection", () => {
  it("strips script tags from html", () => {
    const out = sanitizeStructuredSection({
      html: "<p>Ok</p><script>alert(1)</script>",
      blocks: [],
      mediaRefs: [],
    });
    assert.equal(out.html, "<p>Ok</p>");
  });

  it("preserves immutable calculator blocks on merge", () => {
    const mutated = { ...BLOCK, category: "HACKED" };
    const merged = mergeCalculatorBlocks([BLOCK], [mutated]);
    assert.equal(merged[0]?.category, "O-RADS 4");
  });
});

describe("appendAiDraftHtml", () => {
  it("marks AI draft with banner", () => {
    const out = appendAiDraftHtml({ blocks: [], mediaRefs: [] }, "Тест");
    assert.match(out.html ?? "", /Черновик ИИ/);
    assert.match(out.plain ?? "", /Тест/);
  });
});

describe("buildCaseSearchText", () => {
  it("includes calculator block text", () => {
    const doc = emptyStructuredCaseDocument();
    doc.sections.calculator_result = { blocks: [BLOCK], mediaRefs: [] };
    const text = buildCaseSearchText(doc);
    assert.match(text, /O-RADS 4/);
    assert.match(text, /ACR O-RADS/);
  });
});

describe("large html fragment", () => {
  it("sanitizes oversized safe html within limit", () => {
    const big = `<p>${"a".repeat(5000)}</p>`;
    const safe = sanitizeClinicalHtml(big);
    assert.ok(safe.length <= 12000);
  });
});
