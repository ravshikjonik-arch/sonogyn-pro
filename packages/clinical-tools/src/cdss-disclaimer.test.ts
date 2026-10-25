import assert from "node:assert/strict";
import test from "node:test";

import { cdssOradsCategoryBandLabel, CDSS_SHORT_DISCLAIMER } from "./cdss-disclaimer";

test("CDSS disclaimer is non-empty", () => {
  assert.match(CDSS_SHORT_DISCLAIMER, /диагноз/i);
});

test("category band labels cover 0-5", () => {
  for (let c = 0; c <= 5; c += 1) {
    assert.ok(cdssOradsCategoryBandLabel(c).length > 10);
  }
});
