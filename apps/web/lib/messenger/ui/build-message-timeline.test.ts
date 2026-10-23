import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";

import { buildMessageTimeline } from "./build-message-timeline";

function msg(id: string, author: string, iso: string): ChatBubbleMessage {
  return {
    id,
    client_uuid: id,
    author_id: author,
    body: "x",
    created_at: iso,
  };
}

describe("buildMessageTimeline", () => {
  it("inserts date separator and groups same author within 5 min", () => {
    const items = buildMessageTimeline([
      msg("1", "a", "2026-06-01T10:00:00.000Z"),
      msg("2", "a", "2026-06-01T10:02:00.000Z"),
      msg("3", "b", "2026-06-01T10:03:00.000Z"),
    ]);
    const dates = items.filter((i) => i.kind === "date");
    assert.ok(dates.length > 0);
    const messages = items.filter((i) => i.kind === "message");
    assert.equal(messages[1]?.kind === "message" && messages[1].compact, true);
    assert.equal(messages[2]?.kind === "message" && messages[2].compact, false);
  });
});
