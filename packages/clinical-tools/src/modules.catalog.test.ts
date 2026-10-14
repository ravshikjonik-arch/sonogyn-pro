import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { auditModulesCatalog, listUnmappedAppointmentCalculators } from "./modules-catalog-audit";
import { getModules, HOME_TILE_MODULE_ORDER, MODULES, MODULES_BY_DOMAIN } from "./modules.catalog";

describe("modules.catalog", () => {
  it("has canonical module count (SSOT)", () => {
    assert.ok(MODULES.length >= 65);
  });

  it("domain totals sum to module count", () => {
    const sum = Object.values(MODULES_BY_DOMAIN).reduce((n, list) => n + list.length, 0);
    assert.equal(sum, MODULES.length);
  });

  it("passes audit (refs, unique ids)", () => {
    const result = auditModulesCatalog(MODULES.length);
    assert.ok(result.ok, result.errors.join("; ") || "audit failed");
  });

  it("maps cervical-length to obstetrics", () => {
    const mod = MODULES.find((m) => m.id === "calculator.cervical-length");
    assert.ok(mod);
    assert.equal(mod.domain, "obstetrics");
  });

  it("maps mockup.hub to infra", () => {
    const mod = MODULES.find((m) => m.id === "mockup.hub");
    assert.ok(mod);
    assert.equal(mod.domain, "infra");
  });

  it("lists EXTRA appointment calcs as unmapped (by design)", () => {
    const unmapped = listUnmappedAppointmentCalculators();
    assert.ok(unmapped.includes("o-rads"));
    assert.ok(unmapped.includes("bi-rads"));
  });

  it("getModules home-tile matches HOME_TILE_MODULE_ORDER", () => {
    const tiles = getModules({ surface: "home-tile" });
    assert.equal(tiles.length, HOME_TILE_MODULE_ORDER.length);
    assert.deepEqual(
      tiles.map((t) => t.id),
      HOME_TILE_MODULE_ORDER,
    );
  });
});
