import type { AssistantAnswer } from "@repo/evidence-retrieval";

import { parseSseDataLine } from "./openrouter-client";

export type SonogynChatStreamMeta = {
  evidence?: AssistantAnswer;
  mode?: string;
};

/** Read Sonogyn chat SSE (OpenRouter deltas + optional sonogyn.evidence preamble). */
export async function consumeSonogynChatStream(
  response: Response,
  onDelta: (text: string) => void,
): Promise<SonogynChatStreamMeta> {
  const meta: SonogynChatStreamMeta = {};
  const reader = response.body?.getReader();
  if (!reader) return meta;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (!payload || payload === "[DONE]") continue;

      try {
        const data = JSON.parse(payload) as {
          type?: string;
          evidence?: AssistantAnswer;
          mode?: string;
          choices?: { delta?: { content?: string } }[];
        };
        if (data.type === "sonogyn.evidence") {
          meta.evidence = data.evidence;
          meta.mode = data.mode ?? "evidence";
          continue;
        }
      } catch {
        /* fall through to OpenRouter line parser */
      }

      const delta = parseSseDataLine(line);
      if (delta) onDelta(delta);
    }
  }

  return meta;
}

export function wrapOpenRouterStreamWithEvidence(
  upstream: ReadableStream<Uint8Array>,
  evidence: AssistantAnswer,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const preamble = encoder.encode(
    `data: ${JSON.stringify({ type: "sonogyn.evidence", mode: "evidence", evidence })}\n\n`,
  );

  return new ReadableStream({
    async start(controller) {
      controller.enqueue(preamble);
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
