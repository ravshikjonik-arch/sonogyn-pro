import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CLINICAL_PRIMARY_NAV,
  CLINICAL_PRIMARY_TAB_IDS,
  matchClinicalPrimaryTab,
} from "./primary-nav";

describe("primary-nav", () => {
  it("has exactly 5 tabs in product order", () => {
    assert.equal(CLINICAL_PRIMARY_TAB_IDS.length, 5);
    assert.deepEqual(
      CLINICAL_PRIMARY_NAV.map((e) => e.id),
      ["feed", "cases", "ai", "tools", "profile"],
    );
  });

  it("maps web paths without overlap (ai vs profile)", () => {
    assert.equal(matchClinicalPrimaryTab("/ai/consultants"), "ai");
    assert.equal(matchClinicalPrimaryTab("/ai/workspace"), "ai");
    assert.equal(matchClinicalPrimaryTab("/profile"), "profile");
    assert.equal(matchClinicalPrimaryTab("/tools/refs/guidelines"), "tools");
    assert.equal(matchClinicalPrimaryTab("/feed"), "feed");
    assert.equal(matchClinicalPrimaryTab("/cases/abc"), "cases");
  });

  it("unique mobile tab names", () => {
    const tabs = CLINICAL_PRIMARY_NAV.map((e) => e.mobileTab);
    assert.equal(new Set(tabs).size, tabs.length);
  });
});
