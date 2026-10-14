import type { SonogynChatStreamMeta } from "./stream-client";

/** Read plain text stream from Vercel AI SDK `toTextStreamResponse()`. */
export async function consumeAiSdkTextStream(
  response: Response,
  onDelta: (text: string) => void,
): Promise<SonogynChatStreamMeta> {
  const reader = response.body?.getReader();
  if (!reader) return {};

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (chunk) onDelta(chunk);
  }

  return {};
}
