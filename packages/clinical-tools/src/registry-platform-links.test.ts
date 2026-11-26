import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { platformLinksForGuideline } from "./registry-platform-links";

describe("registry-platform-links", () => {
  it("resolves FMF room and classifications", () => {
    const links = platformLinksForGuideline({
      consensusRoomId: "fmf",
      registryKeys: ["fmf-risk", "mca-psv-anemia"],
    });
    assert.ok(links.some((l) => l.href === "/tools/fmf"));
    assert.ok(links.some((l) => l.href.includes("/tools/calc/fmf")));
  });

  it("dedupes room and primary href", () => {
    const links = platformLinksForGuideline({
      consensusRoomId: "orads-us",
      registryKeys: ["o-rads-us"],
    });
    const orads = links.filter((l) => l.href.includes("o-rads"));
    assert.ok(orads.length >= 1);
  });

  it("resolves routed planned classifications", () => {
    const links = platformLinksForGuideline({ registryKeys: ["eu-tirads", "intergrowth"] });
    assert.ok(links.some((l) => l.href === "/tools/refs/consensus-route/eu-tirads"));
    assert.ok(links.some((l) => l.href === "/tools/refs/consensus-route/intergrowth"));
  });

  it("RCOG SGA links to ISUOG room", () => {
    const links = platformLinksForGuideline({
      consensusRoomId: "isuog-ob",
      registryKeys: ["hadlock", "doppler-velocimetry"],
    });
    assert.ok(links.some((l) => l.href === "/tools/isuog-ob"));
  });
});