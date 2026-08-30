import { isStepCount, streamText } from "ai";

import type { ResolvedLlm } from "@/lib/ai/llm-provider";

import { sonogynClinicalTools } from "../sonogyn-chat/tools/ai-sdk-tools";
import type { ToolExecutionResult } from "../sonogyn-chat/tools/schemas";
import { formatToolResultsBlock } from "../sonogyn-chat/tool-results";

import { toAiSdkMessages } from "./messages";
import { createAiSdkModel } from "./provider";

export function runAiSdkStreamText(params: {
  llm: ResolvedLlm;
  modelId: string;
  systemPrompt: string;
  history: { role: string; content: string }[];
  images?: { mediaType: string; data: string }[];
  enableTools?: boolean;
}) {
  const collectedTools: ToolExecutionResult[] = [];

  const result = streamText({
    model: createAiSdkModel(params.llm, params.modelId),
    messages: toAiSdkMessages({
      history: params.history,
      systemPrompt: params.systemPrompt,
      images: params.images,
    }),
    maxOutputTokens: 4096,
    tools: params.enableTools ? sonogynClinicalTools : undefined,
    stopWhen: params.enableTools ? isStepCount(5) : undefined,
    onStepFinish: ({ toolResults }) => {
      for (const tr of toolResults ?? []) {
        if (tr.output && typeof tr.output === "object") {
          collectedTools.push(tr.output as ToolExecutionResult);
        }
      }
    },
  });

  return { result, collectedTools };
}

/** Plain text stream with optional sonogyn-tools trailer block. */
export function aiSdkTextStreamResponse(
  result: ReturnType<typeof runAiSdkStreamText>["result"],
  collectedTools: ToolExecutionResult[],
  headers: Record<string, string>,
): Response {
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        const trailer = formatToolResultsBlock(collectedTools);
        if (trailer) controller.enqueue(encoder.encode(trailer));
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
