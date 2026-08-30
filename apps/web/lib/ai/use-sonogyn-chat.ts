"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { isAiSdkEnabledClient } from "@/lib/ai/sdk/flags";

/** Thin wrapper around AI SDK `useChat` for gradual Copilot migration. */
export function useSonogynChat() {
  return useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
  });
}

export { isAiSdkEnabledClient };
