import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getBasicCourseLecture } from "./basic-course";

describe("basic-course", () => {
  it("exposes lecture 6 linked to FMF clinical module (no Yandex Disk)", () => {
    const lecture = getBasicCourseLecture("lecture-6-early-pregnancy-4-10");
    assert.ok(lecture);
    assert.equal(lecture!.fileName, "Lecture-6-4-10.pdf");
    assert.equal(lecture!.platformModuleHref, "/ai/consultants/fmf?section=early");
    assert.equal("yandexDiskUrl" in lecture!, false);
  });
});
