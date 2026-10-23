"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

import type { ChatBubbleMessage } from "@/components/chat/ChatMessageBubble";

const BOTTOM_THRESHOLD_PX = 96;
const TOP_LOAD_THRESHOLD_PX = 120;

type Params = {
  scrollRef: RefObject<HTMLDivElement | null>;
  messages: ChatBubbleMessage[];
  userId: string | null;
  hasMoreHistory: boolean;
  loadingOlder: boolean;
  loadOlderHistory: () => Promise<number>;
};

export function useMessengerListScroll({
  scrollRef,
  messages,
  userId,
  hasMoreHistory,
  loadingOlder,
  loadOlderHistory,
}: Params) {
  const atBottomRef = useRef(true);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [unreadBelow, setUnreadBelow] = useState(0);
  const prevLenRef = useRef(messages.length);
  const prevTailIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    atBottomRef.current = true;
    setShowJumpToBottom(false);
    setUnreadBelow(0);
  }, [scrollRef]);

  const handleScroll = useCallback(async () => {
    const el = scrollRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const atBottom = distanceFromBottom <= BOTTOM_THRESHOLD_PX;
    atBottomRef.current = atBottom;
    setShowJumpToBottom(!atBottom);

    if (atBottom) {
      setUnreadBelow(0);
    }

    if (
      el.scrollTop <= TOP_LOAD_THRESHOLD_PX &&
      hasMoreHistory &&
      !loadingOlder
    ) {
      const prevHeight = el.scrollHeight;
      const added = await loadOlderHistory();
      if (added > 0) {
        requestAnimationFrame(() => {
          const next = scrollRef.current;
          if (!next) return;
          next.scrollTop += next.scrollHeight - prevHeight;
        });
      }
    }
  }, [hasMoreHistory, loadOlderHistory, loadingOlder, scrollRef]);

  useEffect(() => {
    const tail = messages[messages.length - 1];
    const tailId = tail ? (tail.client_uuid ?? tail.id) : null;
    const grew = messages.length > prevLenRef.current;
    const tailChanged = tailId != null && tailId !== prevTailIdRef.current;

    prevLenRef.current = messages.length;
    prevTailIdRef.current = tailId;

    if (!grew || !tailChanged) return;

    const fromOthers = userId != null && tail.author_id !== userId;
    if (atBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom(messages.length <= 3 ? "auto" : "smooth"));
    } else if (fromOthers) {
      setUnreadBelow((n) => n + 1);
      setShowJumpToBottom(true);
    }
  }, [messages, scrollToBottom, userId]);

  return {
    showJumpToBottom,
    unreadBelow,
    scrollToBottom,
    handleScroll,
  };
}
