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

/** SSE stream when LLM is skipped (insufficient retrieval) — still sends evidence metadata to client. */
export function createStaticEvidenceChatStream(
  assistantText: string,
  evidence: AssistantAnswer,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "sonogyn.evidence", mode: "evidence", evidence })}\n\n`,
        ),
      );
      const chunk = { choices: [{ delta: { content: assistantText } }] };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
}

/**
 * Passes an OpenRouter SSE stream through unchanged and hands the assembled answer to `onComplete` when it ends.
 * `onComplete` runs before the stream closes so a serverless invocation stays alive until it finishes;
 * a stream cancelled by the client never calls it.
 */
export function captureOpenRouterStreamText(
  upstream: ReadableStream<Uint8Array>,
  onComplete: (text: string) => Promise<void>,
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  const take = (line: string) => {
    const delta = parseSseDataLine(line);
    if (delta) text += delta;
  };

  return upstream.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) take(line);
      },
      async flush() {
        buffer += decoder.decode();
        if (buffer) take(buffer);
        if (!text) return;
        try {
          await onComplete(text);
        } catch {
          /* the answer has already reached the client; a failed save must not turn it into a stream error */
        }
      },
    }),
  );
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
