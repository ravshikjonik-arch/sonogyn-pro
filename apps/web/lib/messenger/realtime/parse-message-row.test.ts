import { describe, expect, it } from "vitest";

import { detectSeqGap, parseMessengerRealtimeRow } from "./parse-message-row";

describe("parseMessengerRealtimeRow", () => {
  it("parses valid insert payload", () => {
    const row = parseMessengerRealtimeRow({
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      chat_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      seq: 3,
      client_uuid: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      sender_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      message_type: "text",
      body: "hi",
      created_at: "2026-01-01T00:00:00Z",
    });
    expect(row?.seq).toBe(3);
  });
});

describe("detectSeqGap", () => {
  it("detects missing seq", () => {
    expect(detectSeqGap(3, 5)).toBe(true);
    expect(detectSeqGap(3, 4)).toBe(false);
  });
});
