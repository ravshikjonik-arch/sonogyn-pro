import type { MessengerOutboxEntry, OutboxSendStatus } from "@/lib/messenger/outbox/types";

export type MessengerSendStatus = OutboxSendStatus | "sent" | "delivered";

export type MergedMessengerMessage = {
  id: string;
  client_uuid: string;
  seq: number | null;
  chat_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  media_type?: "image" | "video" | null;
  media_url?: string | null;
  send_status: MessengerSendStatus;
};

type ServerRow = {
  id: string;
  client_uuid: string;
  seq: number;
  chat_id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
  attachments?: { media_type: string; media_url: string | null }[];
};

function sortKey(msg: MergedMessengerMessage): number {
  if (msg.seq != null) return msg.seq;
  return Number.MAX_SAFE_INTEGER - 1;
}

/** Merge server rows with outbox; dedupe by client_uuid; stable order by seq. */
export function mergeMessengerMessages(
  server: ServerRow[],
  outbox: MessengerOutboxEntry[],
  currentUserId: string,
): MergedMessengerMessage[] {
  const byClient = new Map<string, MergedMessengerMessage>();

  for (const row of server) {
    const att = row.attachments?.[0];
    const mediaType =
      att?.media_type === "image" || att?.media_type === "video" ? att.media_type : null;
    byClient.set(row.client_uuid, {
      id: row.id,
      client_uuid: row.client_uuid,
      seq: row.seq,
      chat_id: row.chat_id,
      sender_id: row.sender_id,
      body: row.body,
      created_at: row.created_at,
      media_type: mediaType,
      media_url: att?.media_url ?? null,
      send_status: row.sender_id === currentUserId ? "delivered" : "sent",
    });
  }

  for (const entry of outbox) {
    if (byClient.has(entry.clientUuid)) continue;
    byClient.set(entry.clientUuid, {
      id: `local:${entry.clientUuid}`,
      client_uuid: entry.clientUuid,
      seq: null,
      chat_id: entry.chatId,
      sender_id: currentUserId,
      body: entry.body,
      created_at: entry.createdAt,
      media_type: entry.attachmentMediaType,
      media_url: entry.localPreviewUrl ?? null,
      send_status: entry.status === "failed" ? "failed" : entry.status === "sending" ? "sending" : "pending",
    });
  }

  return [...byClient.values()].sort((a, b) => {
    const d = sortKey(a) - sortKey(b);
    if (d !== 0) return d;
    return a.created_at.localeCompare(b.created_at);
  });
}

export function maxSeqFromMerged(messages: MergedMessengerMessage[]): number | null {
  let max: number | null = null;
  for (const m of messages) {
    if (m.seq != null && (max == null || m.seq > max)) max = m.seq;
  }
  return max;
}
