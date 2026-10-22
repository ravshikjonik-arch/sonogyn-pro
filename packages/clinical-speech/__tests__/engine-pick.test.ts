import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { willUseCloudServerStt } from "../src/provider/create-speech-engine";

describe("willUseCloudServerStt", () => {
  it("device mode never uses cloud", () => {
    assert.equal(willUseCloudServerStt("device"), false);
  });

  it("server mode prefers cloud when capture exists in browser", () => {
    assert.equal(willUseCloudServerStt("server", { serverTranscribeAvailable: true }), false);
  });
});
