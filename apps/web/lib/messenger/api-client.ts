import type { MessengerSendBody } from "@repo/types";

export type MessengerMessageDto = {
  id: string;
  chat_id: string;
  seq: number;
  client_uuid: string;
  sender_id: string;
  message_type: string;
  body: string | null;
  created_at: string;
  attachments: {
    media_type: string;
    media_url: string | null;
  }[];
};

export async function resolveChannelChatId(legacyChannelId: string): Promise<string> {
  const res = await fetch(
    `/api/messenger/chats?legacyChannelId=${encodeURIComponent(legacyChannelId)}`,
    { cache: "no-store" },
  );
  const payload = (await res.json().catch(() => null)) as { chatId?: string; error?: string } | null;
  if (!res.ok || !payload?.chatId) {
    throw new Error(payload?.error ?? "Не удалось открыть чат v2");
  }
  return payload.chatId;
}

export async function fetchMessengerMessages(params: {
  chatId: string;
  beforeSeq?: number;
  afterSeq?: number;
  limit?: number;
}): Promise<{ messages: MessengerMessageDto[]; lastSeq: number | null; hasMore: boolean }> {
  const q = new URLSearchParams({ chatId: params.chatId });
  if (params.beforeSeq != null) q.set("beforeSeq", String(params.beforeSeq));
  if (params.afterSeq != null) q.set("afterSeq", String(params.afterSeq));
  if (params.limit != null) q.set("limit", String(params.limit));

  const res = await fetch(`/api/messenger/messages?${q.toString()}`, { cache: "no-store" });
  const payload = (await res.json().catch(() => null)) as
    | {
        messages?: MessengerMessageDto[];
        page?: { lastSeq?: number | null; hasMore?: boolean };
        error?: string;
      }
    | null;
  if (!res.ok || !payload?.messages) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Load failed");
  }
  return {
    messages: payload.messages,
    lastSeq: payload.page?.lastSeq ?? null,
    hasMore: payload.page?.hasMore ?? false,
  };
}

export async function fetchMessengerMessageById(
  chatId: string,
  messageId: string,
): Promise<MessengerMessageDto> {
  const q = new URLSearchParams({ chatId, messageId });
  const res = await fetch(`/api/messenger/messages?${q.toString()}`, { cache: "no-store" });
  const payload = (await res.json().catch(() => null)) as
    | { message?: MessengerMessageDto; error?: string }
    | null;
  if (!res.ok || !payload?.message) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Message not found");
  }
  return payload.message;
}

export async function sendMessengerMessage(body: MessengerSendBody): Promise<MessengerMessageDto> {
  const res = await fetch("/api/messenger/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as
    | { message?: MessengerMessageDto & { attachments?: MessengerMessageDto["attachments"] }; error?: string }
    | null;
  if (!res.ok || !payload?.message) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Send failed");
  }
  const msg = payload.message;
  if (!msg.attachments && "attachments" in msg) {
    msg.attachments = (msg as { attachments?: MessengerMessageDto["attachments"] }).attachments ?? [];
  }
  return msg;
}

export type MessengerCaseCardDto = {
  id: string;
  title: string;
  topic: string | null;
  lifecycleStatus: string | null;
  href: string;
};

export async function fetchMessengerCaseCard(caseId: string): Promise<MessengerCaseCardDto> {
  const q = new URLSearchParams({ caseId });
  const res = await fetch(`/api/messenger/case-card?${q.toString()}`, { cache: "no-store" });
  const payload = (await res.json().catch(() => null)) as
    | { card?: MessengerCaseCardDto; error?: string }
    | null;
  if (!res.ok || !payload?.card) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Case card failed");
  }
  return payload.card;
}

export async function submitMessengerReport(body: {
  chatId: string;
  messageId: string;
  reason: string;
}): Promise<void> {
  const res = await fetch("/api/messenger/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "Report failed");
  }
}

export async function fetchMessengerAiSuggest(body: {
  chatId: string;
  prompt: string;
  replyToMessageId?: string;
}): Promise<{ suggestion: string; disclaimer: string }> {
  const res = await fetch("/api/messenger/ai-suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as
    | { suggestion?: string; disclaimer?: string; error?: string }
    | null;
  if (!res.ok || !payload?.suggestion) {
    throw new Error(typeof payload?.error === "string" ? payload.error : "AI suggest failed");
  }
  return {
    suggestion: payload.suggestion,
    disclaimer: payload.disclaimer ?? "",
  };
}
