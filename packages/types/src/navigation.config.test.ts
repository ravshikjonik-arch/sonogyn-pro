import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  HOME_TILE_NAVIGATION_ORDER,
  NAVIGATION_CONFIG,
  NAVIGATION_ITEM_COUNT,
  getHomeTileNavigation,
  getNavigationByDomain,
  getNavigationGroupedByDomain,
  validateNavigationConfig,
  type NavigationItem,
} from "./navigation.config";

const SAMPLE: NavigationItem = {
  id: "test.item",
  slug: "test-item",
  domain: "library",
  category: "test",
  title: "Test",
  description: "Test item",
  icon: "FileText",
  badge: null,
  isPro: false,
  order: 9999,
};

describe("navigation.config", () => {
  it("NAVIGATION_CONFIG validates at import (unique id/slug)", () => {
    assert.ok(NAVIGATION_ITEM_COUNT >= 70);
    const ids = new Set(NAVIGATION_CONFIG.map((i) => i.id));
    const slugs = new Set(NAVIGATION_CONFIG.map((i) => i.slug));
    assert.equal(ids.size, NAVIGATION_CONFIG.length);
    assert.equal(slugs.size, NAVIGATION_CONFIG.length);
  });

  it("excludes duplicate education.calculators-shelf (merged into calculator.hub)", () => {
    assert.ok(!NAVIGATION_CONFIG.some((i) => i.id === "education.calculators-shelf"));
    assert.ok(NAVIGATION_CONFIG.some((i) => i.id === "calculator.hub"));
  });

  it("FMF and elastography are in rads domain", () => {
    const fmf = NAVIGATION_CONFIG.find((i) => i.id === "assistant.fmf");
    const elasto = NAVIGATION_CONFIG.find((i) => i.id === "calculator.elastography");
    assert.equal(fmf?.domain, "rads");
    assert.equal(elasto?.domain, "rads");
  });

  it("library domain includes both Библиотека and КР with subcategories", () => {
    const library = getNavigationByDomain("library");
    assert.ok(library.some((i) => i.id === "education.library-hub" && i.category === "library-shelves"));
    assert.ok(library.some((i) => i.id === "reference.guidelines" && i.category === "clinical-guidelines"));
  });

  it("CPI calculators in gynecology cervix-pathology", () => {
    const gyn = getNavigationByDomain("gynecology");
    const cervix = gyn.filter((i) => i.category === "cervix-pathology");
    const ids = cervix.map((i) => i.id);
    assert.ok(ids.includes("calculator.colposcopy"));
    assert.ok(ids.includes("calculator.cin-risk"));
    assert.ok(ids.includes("calculator.cervical-intelligence"));
  });

  it("ai-assistant quick actions present", () => {
    const ai = getNavigationByDomain("ai-assistant");
    const ids = ai.map((i) => i.id);
    assert.ok(ids.includes("ai-assistant.create-conclusion"));
    assert.ok(ids.includes("ai-assistant.analyze-ultrasound"));
    assert.ok(ids.includes("ai-assistant.consultation"));
    assert.ok(ids.includes("ai-assistant.find-patient"));
    assert.ok(ids.includes("ai-assistant.create-protocol"));
  });

  it("getHomeTileNavigation returns 12 tiles in legacy order", () => {
    const tiles = getHomeTileNavigation();
    assert.equal(tiles.length, 12);
    assert.deepEqual(
      tiles.map((t) => t.id),
      [...HOME_TILE_NAVIGATION_ORDER],
    );
  });

  it("validateNavigationConfig throws on duplicate id", () => {
    assert.throws(
      () =>
        validateNavigationConfig([
          SAMPLE,
          { ...SAMPLE, slug: "test-item-two" },
        ]),
      /Duplicate id/,
    );
  });

  it("validateNavigationConfig throws on duplicate slug", () => {
    assert.throws(
      () =>
        validateNavigationConfig([
          SAMPLE,
          { ...SAMPLE, id: "test.item.two" },
        ]),
      /Duplicate slug/,
    );
  });

  it("every module has href or externalHref after enrich", () => {
    for (const item of NAVIGATION_CONFIG) {
      assert.ok(item.href || item.externalHref, `missing link: ${item.id}`);
      assert.ok(item.accentBar, `missing accentBar: ${item.id}`);
    }
  });

  it("getNavigationGroupedByDomain returns 8 sections sorted by order field", () => {
    const sections = getNavigationGroupedByDomain();
    assert.equal(sections.length, 8);
    assert.deepEqual(
      sections.map((s) => s.domain),
      [
        "obstetrics",
        "gynecology",
        "rads",
        "library",
        "ai-assistant",
        "doctors-chat",
        "education",
        "pro",
      ],
    );
    for (const section of sections) {
      for (let i = 1; i < section.items.length; i++) {
        assert.ok(section.items[i - 1].order <= section.items[i].order);
      }
    }
  });
});
