import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { calculateORADS } from "./oradsCalculator";
import type { OradsInput } from "./types";

/** O-RADS US v2022 lexicon: bilocular = exactly 2 locules (1 complete septation). Synthetic inputs only. */
const BASE: OradsInput = {
  localization: "ovarian",
  menopause: "pre",
  lesionKind: "nonphysiological",
  structure: "multilocular",
  solidComponent: false,
  solidType: "smooth",
  lengthMm: 60,
  widthMm: 50,
  heightMm: 40,
};

describe("bilocular vs multilocular (v2022)", () => {
  it("exactly one septation, smooth, <10 cm → bilocular → O-RADS 2", () => {
    assert.equal(calculateORADS({ ...BASE, septaCount: "1" }).category, 2);
  });

  it("exactly one septation, smooth, ≥10 cm → O-RADS 3 regardless of color score", () => {
    const r = calculateORADS({ ...BASE, septaCount: "1", lengthMm: 110, iotaColorScore: "4" });
    assert.equal(r.category, 3);
  });

  it("'1-3' septations is not an exact count → scored as multilocular, never bilocular O-RADS 2", () => {
    const withColor = calculateORADS({ ...BASE, septaCount: "1-3", iotaColorScore: "2" });
    assert.equal(withColor.category, 3, "multilocular smooth <10 cm, CS 2 → O-RADS 3");
    const withoutColor = calculateORADS({ ...BASE, septaCount: "1-3" });
    assert.equal(withoutColor.riskText, "Нужны данные для расчёта", "multilocular needs a color score");
  });

  it("more than three septations stays multilocular (CS 4 → O-RADS 4)", () => {
    assert.equal(calculateORADS({ ...BASE, septaCount: ">3", iotaColorScore: "4" }).category, 4);
  });

  it("thick septation is not bilocular", () => {
    const r = calculateORADS({ ...BASE, septaCount: "1", septaThickness: "thick", iotaColorScore: "2" });
    assert.equal(r.category, 3);
  });
});
