import type { ToolExecutionResult } from "../sonogyn-chat/tools/schemas";

import type { StreamedAnswer } from "./stream-chat";

/** History row for an AI SDK answer: the streamed text of every step plus the same status notice the user saw. */
export function persistedAssistantMessage(
  answer: StreamedAnswer,
  meta: { sessionId: string; userId: string; modelId: string; promptVersion: string },
): {
  sessionId: string;
  userId: string;
  role: "assistant";
  content: string;
  toolResults: ToolExecutionResult[];
  isAiDraft: true;
  modelId: string;
  promptVersion: string;
} {
  return {
    sessionId: meta.sessionId,
    userId: meta.userId,
    role: "assistant",
    content: `${answer.text.trim()}${answer.notice}`.trim(),
    toolResults: answer.tools,
    isAiDraft: true,
    modelId: meta.modelId,
    promptVersion: meta.promptVersion,
  };
}
