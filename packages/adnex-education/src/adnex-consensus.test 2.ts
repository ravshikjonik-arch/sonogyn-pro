import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  deriveIotaCodesFromInput,
  evaluateAdnexTriangulation,
  evaluateOradsProtocolPitfalls,
} from "./adnex-consensus";

describe("adnex triangulation", () => {
  it("flags incomplete septum trap", () => {
    const g = evaluateOradsProtocolPitfalls({
      structure: "multilocular",
      incompleteSeptum: true,
      solidComponent: false,
    });
    assert.ok(g.some((x) => x.id === "incomplete_septum"));
  });

  it("derives M3 from 4+ papillary", () => {
    const { malignant } = deriveIotaCodesFromInput({ papillaryProjectionCount: "4plus" });
    assert.ok(malignant.includes("M3"));
  });

  it("detects conflict benign IOTA vs high ORADS", () => {
    const tri = evaluateAdnexTriangulation(
      {
        structure: "unilocular",
        acousticShadows: true,
        bloodFlow: "none",
        lengthMm: 40,
        widthMm: 35,
        heightMm: 30,
        solidComponent: false,
      },
      5,
    );
    assert.equal(tri.agreement, "conflict");
  });
});
