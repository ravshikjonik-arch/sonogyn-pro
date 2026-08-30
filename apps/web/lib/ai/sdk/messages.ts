import type { ModelMessage } from "ai";

export function toAiSdkMessages(params: {
  history: { role: string; content: string }[];
  systemPrompt: string;
  images?: { mediaType: string; data: string }[];
}): ModelMessage[] {
  const out: ModelMessage[] = [{ role: "system", content: params.systemPrompt }];

  for (let i = 0; i < params.history.length; i++) {
    const msg = params.history[i]!;
    const isLastUser = i === params.history.length - 1 && msg.role === "user";

    if (isLastUser && params.images?.length) {
      out.push({
        role: "user",
        content: [
          ...params.images.map((img) => ({
            type: "image" as const,
            image: `data:${img.mediaType};base64,${img.data}`,
          })),
          { type: "text" as const, text: msg.content },
        ],
      });
    } else if (msg.role === "user" || msg.role === "assistant") {
      out.push({ role: msg.role, content: msg.content });
    }
  }

  return out;
}
