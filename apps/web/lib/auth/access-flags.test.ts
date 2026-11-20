import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isFullOpenAccessEnabled } from "./access-flags";

const LAUNCH = Date.UTC(2026, 11, 27, 0, 0, 0);

describe("isFullOpenAccessEnabled cutover", () => {
  it("allows pilot before 27.12.2026 when env default", () => {
    assert.equal(isFullOpenAccessEnabled(LAUNCH - 1), true);
  });

  it("ends pilot on/after 27.12.2026 without force flag", () => {
    assert.equal(isFullOpenAccessEnabled(LAUNCH), false);
    assert.equal(isFullOpenAccessEnabled(LAUNCH + 86_400_000), false);
  });
});
