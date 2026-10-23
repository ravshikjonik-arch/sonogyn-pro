import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MessengerSendBodySchema } from "./messenger";

describe("MessengerSendBodySchema", () => {
  it("requires body or attachment", () => {
    const r = MessengerSendBodySchema.safeParse({
      chatId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      clientUuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });
    assert.equal(r.success, false);
  });

  it("accepts text with client uuid", () => {
    const r = MessengerSendBodySchema.safeParse({
      chatId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      clientUuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      body: "Привет, коллеги",
    });
    assert.equal(r.success, true);
  });
});
