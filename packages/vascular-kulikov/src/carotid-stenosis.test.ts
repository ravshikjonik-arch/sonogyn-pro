import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { gradeCarotidStenosis } from "./carotid-stenosis";

describe("gradeCarotidStenosis", () => {
  it("grades severe by PSV ≥ 230", () => {
    const r = gradeCarotidStenosis({ psvIcaCmS: 240, psvCcaCmS: 80 });
    assert.equal(r.grade, "severe");
    assert.equal(r.hemodynamicallySignificant, true);
  });

  it("grades moderate by PSV 125–229", () => {
    const r = gradeCarotidStenosis({ psvIcaCmS: 160, psvCcaCmS: 90 });
    assert.equal(r.grade, "moderate");
  });

  it("marks occlusion when suspected", () => {
    const r = gradeCarotidStenosis({ occlusionSuspected: true });
    assert.equal(r.grade, "occlusion");
  });
});
