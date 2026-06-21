import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  generateStructuredReportFromRequest,
  renderAdnexStructuredReport,
} from "./renderAdnexReport.js";

describe("renderAdnexStructuredReport", () => {
  it("generates description, impression, recommendations for adnex input", () => {
    const output = renderAdnexStructuredReport({
      domain: "adnex",
      morphology: {
        localization: "ovarian",
        menopause: "pre",
        lesionKind: "nonphysiological",
        structure: "unilocular",
        solidComponent: false,
      },
      measurements: { lengthMm: 42, widthMm: 38, heightMm: 35 },
      classification: { oradsCategory: 2 },
    });

    assert.match(output.description, /УЗ-придатки/);
    assert.match(output.description, /42 мм/);
    assert.match(output.impression, /O-RADS US: 2/);
    assert.match(output.recommendations, /O-RADS 2/);
    assert.ok(output.citations.length >= 3);
    assert.equal(output.locale, "ru");
    assert.equal(output.templateSlug, "adnex-orads-v1");
  });

  it("defaults to O-RADS 3 when category missing", () => {
    const output = renderAdnexStructuredReport({
      domain: "adnex",
      morphology: { localization: "ovarian", menopause: "post", structure: "solid", solidComponent: true },
      measurements: {},
      classification: {},
    });

    assert.match(output.impression, /O-RADS US: 3/);
    assert.match(output.impression, /не указана/);
  });

  it("wraps GenerateStructuredReportRequest", () => {
    const doc = generateStructuredReportFromRequest({
      templateSlug: "adnex-orads-v1",
      locale: "ru",
      preview: true,
      input: {
        domain: "adnex",
        morphology: { localization: "ovarian", menopause: "pre", structure: "multilocular" },
        measurements: { lengthMm: 55 },
        classification: { oradsCategory: 3 },
      },
    });

    assert.equal(doc.version, "2026.1");
    assert.equal(doc.status, "draft");
    assert.equal(doc.input.domain, "adnex");
    assert.ok(doc.output.description.length > 20);
  });
});
