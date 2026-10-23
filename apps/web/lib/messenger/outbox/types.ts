export type OutboxSendStatus = "pending" | "sending" | "failed";

export type MessengerOutboxEntry = {
  clientUuid: string;
  chatId: string;
  legacyChannelId: string;
  body: string | null;
  attachmentStoragePath: string | null;
  attachmentMediaType: "image" | "video" | null;
  /** Optimistic preview (object URL) — not persisted in IDB. */
  localPreviewUrl?: string | null;
  status: OutboxSendStatus;
  createdAt: string;
  retryCount: number;
  lastError: string | null;
};

export type MessengerMessageCache = {
  chatId: string;
  messages: unknown[];
  maxSeq: number | null;
  savedAt: string;
};
