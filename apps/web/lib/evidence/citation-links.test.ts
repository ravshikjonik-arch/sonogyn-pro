import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { CLINICAL_GUIDELINES } from "@repo/clinical-guidelines";

import { resolveInternalGuidelineHref } from "./citation-links";

describe("citation-links", () => {
  it("maps known guideline id to in-app href", () => {
    const sample = CLINICAL_GUIDELINES[0];
    assert.ok(sample);
    const href = resolveInternalGuidelineHref({ recordId: sample.id, title: sample.title });
    assert.equal(href, `/tools/refs/guidelines/${sample.id}`);
  });

  it("maps officialUrl to in-app href", () => {
    const withUrl = CLINICAL_GUIDELINES.find((g) => g.officialUrl);
    if (!withUrl?.officialUrl) return;
    const href = resolveInternalGuidelineHref({ url: withUrl.officialUrl });
    assert.equal(href, `/tools/refs/guidelines/${withUrl.id}`);
  });
});
