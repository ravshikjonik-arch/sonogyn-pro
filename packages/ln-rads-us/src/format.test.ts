import assert from "node:assert/strict";
import { test } from "node:test";

import { formatLnAxesRu, formatLnMm, formatLnRatio } from "./format";

test("lymph node axes use the shared display format", () => {
  assert.equal(formatLnAxesRu(22, 9), "22,0×9,0 мм");
  assert.equal(formatLnAxesRu(22.44, 9.06), "22,4×9,1 мм");
  assert.equal(formatLnAxesRu(22, undefined), "не указаны полностью (нет: короткая ось)");
  assert.equal(formatLnMm(3), "3,0");
  assert.equal(formatLnRatio(2.444), "2,44");
  assert.equal(formatLnRatio(undefined), "н/д");
});
