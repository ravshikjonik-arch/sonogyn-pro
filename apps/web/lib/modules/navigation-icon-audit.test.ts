import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { auditNavigationIconMappings } from "./navigation-icon-audit";

describe("navigation icon audit", () => {
  it("every navigation.config icon name is mapped in NAVIGATION_ICON_MAP", () => {
    const result = auditNavigationIconMappings();
    assert.equal(
      result.modulesWithMissingMapping.length,
      0,
      `unmapped icons: ${result.modulesWithMissingMapping.map((m) => `${m.id} (${m.icon})`).join(", ")}`,
    );
    assert.ok(result.ok);
  });
});
