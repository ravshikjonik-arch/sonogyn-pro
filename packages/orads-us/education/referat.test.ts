import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getOradsReferat, ORADS_REFERAT_RU } from "./index";
import { getReferatImagePath, ORADS_REFERAT_IMAGE_BY_REF } from "./referatImageMap";
import { getReferatSectionIdForWizardNode, referatGuideHref } from "./wizardSectionMap";

describe("O-RADS referat education bundle", () => {
  it("has sections, cases, and category table", () => {
    assert.ok(ORADS_REFERAT_RU.sections.length >= 10);
    assert.equal(ORADS_REFERAT_RU.cases.length, 11);
    assert.equal(ORADS_REFERAT_RU.categories.length, 6);
  });

  it("maps wizard nodes to referat sections", () => {
    assert.equal(getReferatSectionIdForWizardNode("step1_localization", ORADS_REFERAT_RU), "localization");
    assert.equal(getReferatSectionIdForWizardNode("step4_papillary_count", ORADS_REFERAT_RU), "solid-vascularity");
  });

  it("builds guide href with anchor", () => {
    assert.equal(referatGuideHref("localization"), "/library/orads-guide#localization");
  });

  it("loads English referat by locale", () => {
    const en = getOradsReferat("en");
    assert.equal(en.meta.title, "O-RADS US Classification");
    assert.equal(en.cases.length, 11);
  });

  it("maps wizard imageRef to referat echograms", () => {
    assert.ok(getReferatImagePath("atlas/papillary_4plus")?.includes("case-10.png"));
    assert.ok(getReferatImagePath("atlas/irregular_wall")?.includes("case-06.png"));
    const refs = Object.keys(ORADS_REFERAT_IMAGE_BY_REF);
    assert.ok(refs.includes("atlas/extraovarian/hydrosalpinx"));
    assert.ok(refs.includes("atlas/localization"));
  });
});
