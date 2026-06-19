import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { oradsManagementForCategory } from "./orads-protocol";
import { evaluateIotaSimpleRules } from "./ozerskaya-iota";

describe("ozerskaya iota", () => {
  it("benign only", () => {
    const r = evaluateIotaSimpleRules(["B1", "B5"], []);
    assert.equal(r.verdict, "benign");
  });

  it("malignant only", () => {
    const r = evaluateIotaSimpleRules([], ["M2", "M5"]);
    assert.equal(r.verdict, "malignant");
  });

  it("management map", () => {
    assert.match(oradsManagementForCategory(4), /онкогинеколог/i);
  });
});
