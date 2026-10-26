const QUOTE_RE = /^«([^»\n]{1,160})»\n([\s\S]*)$/;

export function encodeReplyQuote(excerpt: string, text: string): string {
  const clean = excerpt.replace(/[«»\n]/g, " ").replace(/\s+/g, " ").trim().slice(0, 140);
  if (!clean) return text;
  return `«${clean}»\n${text}`;
}

export function parseReplyQuote(body: string | null): { excerpt: string | null; text: string | null } {
  if (!body) return { excerpt: null, text: null };
  const match = QUOTE_RE.exec(body);
  if (!match) return { excerpt: null, text: body };
  return { excerpt: match[1] ?? null, text: match[2] ?? "" };
}
