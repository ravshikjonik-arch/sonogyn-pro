import assert from "node:assert/strict";
import { test } from "node:test";

import { formatDimensionsMmRu, formatMeasurementRu, formatMmRu, hasThreeDimensions, parseMeasurementMm } from "./units";

test("display format: decimal comma, always one tenth", () => {
  assert.equal(formatMeasurementRu(44.2), "44,2");
  assert.equal(formatMeasurementRu(12), "12,0");
  assert.equal(formatMeasurementRu(39.44), "39,4");
  assert.equal(formatMeasurementRu(42.95), "43,0");
  assert.equal(formatMmRu(7.5), "7,5 мм");
});

test("three dimensions: 44,2×39,4×42,9 мм, null when any is missing", () => {
  assert.equal(formatDimensionsMmRu(44.2, 39.4, 42.9), "44,2×39,4×42,9 мм");
  assert.equal(formatDimensionsMmRu(44.2, 39.4, undefined), null);
  assert.equal(formatDimensionsMmRu(44.2, 0, 42.9), null);
  assert.equal(hasThreeDimensions(1, 2, 3), true);
  assert.equal(hasThreeDimensions(1, Number.NaN, 3), false);
});

test("input accepts comma and rounds to 0.1 mm", () => {
  assert.equal(parseMeasurementMm("44,2"), 44.2);
  assert.equal(parseMeasurementMm("39.44"), 39.4);
  assert.equal(parseMeasurementMm("abc"), undefined);
});
