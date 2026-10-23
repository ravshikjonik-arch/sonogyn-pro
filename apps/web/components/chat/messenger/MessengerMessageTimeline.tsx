"use client";

import { useMemo, type RefObject } from "react";

import { ChatMessageBubble, type ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";
import type { AuthorTrustMap } from "@/lib/trust/resolve-author-trust";
import { MessengerClinicalCardEmbed } from "@/components/chat/messenger/MessengerClinicalCardEmbed";
import { buildMessageTimeline, type ChatTimelineItem } from "@/lib/messenger/ui/build-message-timeline";
import { extractCaseIdsFromMessageBody } from "@/lib/messenger/ui/parse-clinical-links";
import { useEstimatedVirtualRange } from "@/lib/messenger/ui/use-estimated-virtual-range";
import { cn } from "@/lib/utils/cn";

type Props = {
  messages: ChatBubbleMessage[];
  authorNames: Record<string, string>;
  authorTrust: AuthorTrustMap;
  userId: string | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  onRetrySend?: (clientUuid: string) => void;
  onReportMessage?: (messageId: string) => void;
  loadingOlder?: boolean;
  className?: string;
};

function renderSlice(
  slice: ChatTimelineItem[],
  props: Omit<Props, "messages" | "scrollRef" | "onScroll" | "className"> & { mine: Set<string> },
) {
  return slice.map((item) => {
    if (item.kind === "date") {
      return (
        <div
          key={item.key}
          className="flex justify-center py-2"
          style={{ contentVisibility: "auto", containIntrinsicSize: "auto 32px" }}
        >
          <span className="rounded-full bg-[var(--clinical-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--clinical-foreground-muted)]">
            {item.label}
          </span>
        </div>
      );
    }

    const msg = item.message;
    const isMine = props.mine.has(msg.author_id);
    const caseIds = extractCaseIdsFromMessageBody(msg.body);
    const canReport =
      !isMine && !msg.id.startsWith("local:") && Boolean(props.onReportMessage);
    return (
      <div
        key={item.key}
        className={cn(item.compact ? "mt-0.5" : "mt-2")}
        style={{ contentVisibility: "auto", containIntrinsicSize: "auto 88px" }}
      >
        <ChatMessageBubble
          message={msg}
          authorName={props.authorNames[msg.author_id] ?? "Коллега"}
          authorVerified={props.authorTrust[msg.author_id]?.isVerified ?? false}
          isMine={isMine}
          compact={item.compact}
          canReport={canReport}
          onReport={
            canReport && props.onReportMessage ? () => props.onReportMessage!(msg.id) : undefined
          }
          onRetrySend={
            msg.send_status === "failed" && msg.client_uuid && props.onRetrySend
              ? () => props.onRetrySend!(msg.client_uuid!)
              : undefined
          }
        />
        {caseIds.map((caseId) => (
          <MessengerClinicalCardEmbed key={`${item.key}:${caseId}`} caseId={caseId} />
        ))}
      </div>
    );
  });
}

export function MessengerMessageTimeline({
  messages,
  authorNames,
  authorTrust,
  userId,
  scrollRef,
  onScroll,
  onRetrySend,
  loadingOlder,
  className,
}: Props) {
  const timeline = useMemo(() => buildMessageTimeline(messages), [messages]);
  const virtual = useEstimatedVirtualRange(timeline.length, scrollRef);
  const mine = useMemo(() => new Set(userId ? [userId] : []), [userId]);

  const slice = virtual.enabled ? timeline.slice(virtual.start, virtual.end) : timeline;

  return (
    <div
      ref={scrollRef}
      onScroll={() => {
        virtual.onScroll();
        onScroll();
      }}
      className={cn("doctor-chat-messages relative min-h-0 flex-1 overflow-y-auto overscroll-contain", className)}
    >
      <div className="p-4">
        {loadingOlder ? (
          <p className="mb-2 text-center text-xs text-[var(--clinical-foreground-muted)]">
            Загрузка истории…
          </p>
        ) : null}
        {virtual.enabled ? <div aria-hidden style={{ height: virtual.paddingTop }} /> : null}
        {renderSlice(slice, { authorNames, authorTrust, userId, onRetrySend, mine })}
        {virtual.enabled ? <div aria-hidden style={{ height: virtual.paddingBottom }} /> : null}
      </div>
    </div>
  );
}
