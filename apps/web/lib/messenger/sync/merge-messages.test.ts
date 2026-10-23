import { describe, expect, it } from "vitest";

import type { MessengerOutboxEntry } from "@/lib/messenger/outbox/types";

import { maxSeqFromMerged, mergeMessengerMessages } from "./merge-messages";

const USER = "11111111-1111-1111-1111-111111111111";

describe("mergeMessengerMessages", () => {
  it("orders by seq and appends pending outbox", () => {
    const merged = mergeMessengerMessages(
      [
        {
          id: "a",
          client_uuid: "00000000-0000-0000-0000-000000000001",
          seq: 1,
          chat_id: "c",
          sender_id: USER,
          body: "one",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      [
        {
          clientUuid: "00000000-0000-0000-0000-000000000002",
          chatId: "c",
          legacyChannelId: "d",
          body: "two",
          attachmentStoragePath: null,
          attachmentMediaType: null,
          status: "pending",
          createdAt: "2026-01-01T00:00:01.000Z",
          retryCount: 0,
          lastError: null,
        } satisfies MessengerOutboxEntry,
      ],
      USER,
    );
    expect(merged).toHaveLength(2);
    expect(merged[0]!.seq).toBe(1);
    expect(merged[1]!.send_status).toBe("pending");
  });

  it("dedupes outbox when server has same client_uuid", () => {
    const client = "00000000-0000-0000-0000-000000000099";
    const merged = mergeMessengerMessages(
      [
        {
          id: "srv",
          client_uuid: client,
          seq: 5,
          chat_id: "c",
          sender_id: USER,
          body: "ok",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      [
        {
          clientUuid: client,
          chatId: "c",
          legacyChannelId: "d",
          body: "ok",
          attachmentStoragePath: null,
          attachmentMediaType: null,
          status: "pending",
          createdAt: "2026-01-01T00:00:00.000Z",
          retryCount: 0,
          lastError: null,
        },
      ],
      USER,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]!.id).toBe("srv");
  });
});

describe("maxSeqFromMerged", () => {
  it("returns highest seq", () => {
    expect(
      maxSeqFromMerged([
        {
          id: "1",
          client_uuid: "a",
          seq: 3,
          chat_id: "c",
          sender_id: USER,
          body: null,
          created_at: "",
          send_status: "sent",
        },
        {
          id: "local",
          client_uuid: "b",
          seq: null,
          chat_id: "c",
          sender_id: USER,
          body: "x",
          created_at: "",
          send_status: "pending",
        },
      ]),
    ).toBe(3);
  });
});
