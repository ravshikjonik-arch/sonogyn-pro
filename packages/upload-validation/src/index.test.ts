import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { detectClinicalImageKind, validateClinicalImageBuffer } from "./index";

describe("upload-validation", () => {
  it("detects PNG", () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
    assert.equal(detectClinicalImageKind(png), "png");
  });

  it("rejects executable signature", () => {
    const exe = new Uint8Array([0x4d, 0x5a]);
    const r = validateClinicalImageBuffer(exe);
    assert.equal(r.ok, false);
  });
});
