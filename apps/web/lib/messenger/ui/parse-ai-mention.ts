const AI_MENTION = /^@(?:AI|ИИ|Ai|ai)\s+([\s\S]*)$/u;

export type ParsedAiMention = { prompt: string; bodyForSend: string };

/** Strip leading @AI / @ИИ mention; returns tutor prompt if present. */
export function parseMessengerAiMention(raw: string): ParsedAiMention | null {
  const trimmed = raw.trim();
  const match = trimmed.match(AI_MENTION);
  if (!match) return null;
  const prompt = (match[1] ?? "").trim();
  if (prompt.length < 3) return null;
  return { prompt, bodyForSend: `@AI ${prompt}` };
}
