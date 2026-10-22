import assert from "node:assert/strict";
import test from "node:test";

import { searchCalculatorSeo } from "./search-calculator-seo";

test("searchCalculatorSeo finds bishop and vbac by ru/en terms", () => {
  const bishop = searchCalculatorSeo("bishop", 5);
  assert.ok(bishop.some((h) => h.href.includes("/tools/calc/ob/bishop")));

  const vbac = searchCalculatorSeo("tolac", 5);
  assert.ok(vbac.some((h) => h.href.includes("/tools/calc/ob/vbac")));
});

test("searchCalculatorSeo default ranks o-rads and appointment hub", () => {
  const hits = searchCalculatorSeo("", 8);
  assert.ok(hits.some((h) => h.href.includes("o-rads")));
  assert.ok(hits.some((h) => h.href.includes("/tools/calc/appointment")));
});
