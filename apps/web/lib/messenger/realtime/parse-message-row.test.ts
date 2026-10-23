import assert from "node:assert/strict";
import { describe, it } from "node:test";

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
    assert.equal(row?.seq, 3);
  });
});

describe("detectSeqGap", () => {
  it("detects missing seq", () => {
    assert.equal(detectSeqGap(3, 5), true);
    assert.equal(detectSeqGap(3, 4), false);
  });
});
