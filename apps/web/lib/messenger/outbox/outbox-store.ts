import { outboxDelete, outboxListAll, outboxListByChat, outboxPut } from "@/lib/messenger/outbox/idb";
import type { MessengerOutboxEntry, OutboxSendStatus } from "@/lib/messenger/outbox/types";

function parseEntry(raw: Record<string, unknown>): MessengerOutboxEntry | null {
  if (typeof raw.clientUuid !== "string") return null;
  return {
    clientUuid: raw.clientUuid,
    chatId: String(raw.chatId ?? ""),
    legacyChannelId: String(raw.legacyChannelId ?? ""),
    body: typeof raw.body === "string" ? raw.body : null,
    attachmentStoragePath:
      typeof raw.attachmentStoragePath === "string" ? raw.attachmentStoragePath : null,
    attachmentMediaType:
      raw.attachmentMediaType === "image" || raw.attachmentMediaType === "video"
        ? raw.attachmentMediaType
        : null,
    status:
      raw.status === "pending" || raw.status === "sending" || raw.status === "failed"
        ? raw.status
        : "pending",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date().toISOString(),
    retryCount: typeof raw.retryCount === "number" ? raw.retryCount : 0,
    lastError: typeof raw.lastError === "string" ? raw.lastError : null,
  };
}

export async function loadOutboxForChat(chatId: string): Promise<MessengerOutboxEntry[]> {
  const rows = await outboxListByChat(chatId);
  return rows.map(parseEntry).filter((e): e is MessengerOutboxEntry => e != null);
}

export async function loadAllOutbox(): Promise<MessengerOutboxEntry[]> {
  const rows = await outboxListAll();
  return rows.map(parseEntry).filter((e): e is MessengerOutboxEntry => e != null);
}

export async function saveOutboxEntry(entry: MessengerOutboxEntry): Promise<void> {
  await outboxPut({ ...entry });
}

export async function removeOutboxEntry(clientUuid: string): Promise<void> {
  await outboxDelete(clientUuid);
}

export async function patchOutboxStatus(
  entry: MessengerOutboxEntry,
  status: OutboxSendStatus,
  lastError: string | null,
): Promise<MessengerOutboxEntry> {
  const next: MessengerOutboxEntry = {
    ...entry,
    status,
    lastError,
    retryCount: status === "failed" ? entry.retryCount + 1 : entry.retryCount,
  };
  await saveOutboxEntry(next);
  return next;
}
