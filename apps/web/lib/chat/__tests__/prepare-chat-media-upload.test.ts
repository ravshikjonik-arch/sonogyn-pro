import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";

import { prepareChatMediaUpload } from "../prepare-chat-media-upload";

async function jpegFileWithExif(): Promise<File> {
  const buffer = await sharp({
    create: { width: 2, height: 2, channels: 3, background: { r: 10, g: 20, b: 30 } },
  })
    .jpeg()
    .withMetadata({ exif: { IFD0: { Copyright: "PHI-should-not-leak" } } })
    .toBuffer();
  const blob = new Blob([new Uint8Array(buffer)], { type: "image/jpeg" });
  return new File([blob], "us.jpg", { type: "image/jpeg" });
}

describe("prepareChatMediaUpload", () => {
  it("strips metadata from raster images", async () => {
    const result = await prepareChatMediaUpload(await jpegFileWithExif());
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.mediaType, "image");
    assert.equal(result.metadataStripped, true);
    assert.ok(result.buffer.length > 0);
  });
});
