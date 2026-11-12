import { isStepCount, streamText, type LanguageModel } from "ai";

import type { ResolvedLlm } from "@/lib/ai/llm-provider";

import { createSonogynClinicalTools } from "../sonogyn-chat/tools/ai-sdk-tools";
import { isAllowedToolName } from "../sonogyn-chat/tools/execute";
import type { ToolExecutionResult } from "../sonogyn-chat/tools/schemas";
import { buildToolCompletionNotice, formatToolResultsBlock } from "../sonogyn-chat/tool-results";

export const CLINICAL_TOOL_STEP_LIMIT = 5;

import { toAiSdkMessages } from "./messages";
import { createAiSdkModel } from "./provider";

/** A call the SDK could not hand to `execute` (e.g. unparsable arguments) is still recorded as rejected. */
function rejectedFromSdkError(part: { toolName?: unknown; input?: unknown; error?: unknown }): ToolExecutionResult | null {
  const toolName = String(part.toolName ?? "");
  if (!isAllowedToolName(toolName)) return null;
  const message = part.error instanceof Error ? part.error.name : "tool_error";
  return {
    tool: toolName,
    ok: false,
    rejected: true,
    status: "incomplete",
    engineVersion: "n/a",
    sourceLabel: "ai-sdk",
    inputEcho: typeof part.input === "object" && part.input ? (part.input as Record<string, unknown>) : {},
    validationIssues: [{ path: "input", message: "аргументы вызова не разобраны" }],
    error: `Вызов отклонён до расчёта (${message}).`,
  };
}

export function runAiSdkStreamText(params: {
  llm: ResolvedLlm;
  modelId: string;
  systemPrompt: string;
  history: { role: string; content: string }[];
  images?: { mediaType: string; data: string }[];
  enableTools?: boolean;
  /** Test seam: replaces the provider model. */
  model?: LanguageModel;
}) {
  const collectedTools: ToolExecutionResult[] = [];

  const result = streamText({
    model: params.model ?? createAiSdkModel(params.llm, params.modelId),
    instructions: params.systemPrompt,
    messages: toAiSdkMessages({
      history: params.history,
      images: params.images,
    }),
    maxOutputTokens: 4096,
    tools: params.enableTools ? createSonogynClinicalTools() : undefined,
    stopWhen: params.enableTools ? isStepCount(CLINICAL_TOOL_STEP_LIMIT) : undefined,
    onStepFinish: ({ content }) => {
      for (const part of content as Array<Record<string, unknown>>) {
        if (part.type === "tool-result" && part.output && typeof part.output === "object") {
          collectedTools.push(part.output as ToolExecutionResult);
        } else if (part.type === "tool-error") {
          const rejected = rejectedFromSdkError(part);
          if (rejected) collectedTools.push(rejected);
        }
      }
    },
  });

  return { result, collectedTools };
}

export type StreamedAnswer = {
  /** Text of every step exactly as streamed (without notice and trailer). */
  text: string;
  /** Structured-status notice appended after the text. */
  notice: string;
  tools: ToolExecutionResult[];
};

/**
 * Plain text stream with an optional status notice and sonogyn-tools trailer. `onComplete` receives exactly what
 * was streamed, so the persisted answer matches the streamed one.
 */
export function aiSdkTextStreamResponse(
  result: ReturnType<typeof runAiSdkStreamText>["result"],
  collectedTools: ToolExecutionResult[],
  headers: Record<string, string>,
  onComplete?: (answer: StreamedAnswer) => Promise<void> | void,
): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        let text = "";
        for await (const chunk of result.textStream) {
          text += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
        const notice = buildToolCompletionNotice(text, collectedTools);
        if (notice) controller.enqueue(encoder.encode(notice));
        const trailer = formatToolResultsBlock(collectedTools);
        if (trailer) controller.enqueue(encoder.encode(trailer));
        if (onComplete) {
          try {
            await onComplete({ text, notice, tools: [...collectedTools] });
          } catch {
            /* persistence failure must not break the delivered answer */
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      ...headers,
    },
  });
}
