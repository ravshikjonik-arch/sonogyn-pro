import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getBasicCourseLecture, yandexDiskViewerUrl } from "./basic-course";

describe("basic-course", () => {
  it("builds Yandex Disk iframe URL from public link", () => {
    assert.equal(
      yandexDiskViewerUrl("https://disk.yandex.ru/i/HBUWonJavsL1DA"),
      "https://disk.yandex.ru/iframe/i/HBUWonJavsL1DA",
    );
  });

  it("exposes lecture 6 with Yandex PDF", () => {
    const lecture = getBasicCourseLecture("lecture-6-early-pregnancy-4-10");
    assert.ok(lecture);
    assert.match(lecture!.yandexDiskUrl ?? "", /^https:\/\/disk\.yandex\.ru\/i\//);
    assert.equal(lecture!.fileName, "Lecture-6-4-10.pdf");
  });
});
