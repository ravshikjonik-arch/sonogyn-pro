import type { ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";

import { formatChatDateLabel } from "@/lib/messenger/ui/format-chat-date";

export type MessageTimelineItem = {
  kind: "message";
  key: string;
  message: ChatBubbleMessage;
  /** Hide avatar / author row when grouped with previous bubble. */
  compact: boolean;
};

export type DateTimelineItem = {
  kind: "date";
  key: string;
  label: string;
};

export type ChatTimelineItem = MessageTimelineItem | DateTimelineItem;

const GROUP_MS = 5 * 60 * 1000;

function sameGroup(prev: ChatBubbleMessage, next: ChatBubbleMessage): boolean {
  if (prev.author_id !== next.author_id) return false;
  const a = new Date(prev.created_at).getTime();
  const b = new Date(next.created_at).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(b - a) <= GROUP_MS;
}

/** Flat messages → date chips + grouped bubbles (stable keys). */
export function buildMessageTimeline(messages: ChatBubbleMessage[]): ChatTimelineItem[] {
  const out: ChatTimelineItem[] = [];
  let lastDateLabel: string | null = null;
  let prevMsg: ChatBubbleMessage | null = null;

  for (const message of messages) {
    const dateLabel = formatChatDateLabel(message.created_at);
    if (dateLabel !== lastDateLabel) {
      out.push({ kind: "date", key: `date:${dateLabel}:${message.created_at}`, label: dateLabel });
      lastDateLabel = dateLabel;
      prevMsg = null;
    }

    const compact = prevMsg != null && sameGroup(prevMsg, message);
    out.push({
      kind: "message",
      key: message.client_uuid ?? message.id,
      message,
      compact,
    });
    prevMsg = message;
  }

  return out;
}
