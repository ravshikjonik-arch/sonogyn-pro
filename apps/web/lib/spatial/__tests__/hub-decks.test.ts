import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getToolsForDeck, parseSpatialHubDeck, SPATIAL_HUB_DECKS } from "../hub-decks";

describe("hub-decks", () => {
  it("parses known deck ids", () => {
    assert.equal(parseSpatialHubDeck("rads"), "rads");
    assert.equal(parseSpatialHubDeck("unknown"), null);
  });

  it("returns O-RADS href for rads deck without duplicate hrefs", () => {
    const tools = getToolsForDeck("rads");
    assert.ok(tools.some((t) => t.webHref?.includes("o-rads")));
    const hrefs = tools.map((t) => t.webHref);
    assert.equal(hrefs.length, new Set(hrefs).size);
  });

  it("covers all deck definitions", () => {
    assert.equal(SPATIAL_HUB_DECKS.length, 6);
    for (const deck of SPATIAL_HUB_DECKS) {
      assert.ok(getToolsForDeck(deck.id).length > 0, deck.id);
    }
  });
});
