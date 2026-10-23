import { describe, expect, it } from "vitest";

import { MessengerSendBodySchema } from "./messenger";

describe("MessengerSendBodySchema", () => {
  it("requires body or attachment", () => {
    const r = MessengerSendBodySchema.safeParse({
      chatId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      clientUuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    });
    expect(r.success).toBe(false);
  });

  it("accepts text with client uuid", () => {
    const r = MessengerSendBodySchema.safeParse({
      chatId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      clientUuid: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      body: "Привет, коллеги",
    });
    expect(r.success).toBe(true);
  });
});
