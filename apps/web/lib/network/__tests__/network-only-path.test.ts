import assert from "node:assert/strict";
import test from "node:test";

import { isNetworkOnlyPath } from "../network-only-path";

test("isNetworkOnlyPath matches network sections", () => {
  assert.equal(isNetworkOnlyPath("/cases"), true);
  assert.equal(isNetworkOnlyPath("/cases/abc"), true);
  assert.equal(isNetworkOnlyPath("/feed"), true);
  assert.equal(isNetworkOnlyPath("/profile/patients"), true);
  assert.equal(isNetworkOnlyPath("/profile/patients/new"), true);
  assert.equal(isNetworkOnlyPath("/ai/workspace"), true);
  assert.equal(isNetworkOnlyPath("/tools/refs/evidence-assistant"), true);
});

test("isNetworkOnlyPath allows offline calculators", () => {
  assert.equal(isNetworkOnlyPath("/tools/calc/rads/o-rads"), false);
  assert.equal(isNetworkOnlyPath("/home"), false);
  assert.equal(isNetworkOnlyPath("/profile"), false);
  assert.equal(isNetworkOnlyPath(null), false);
});
