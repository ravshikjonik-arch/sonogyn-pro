const CASE_PATH =
  /(?:https?:\/\/[^\s/]+)?\/cases\/([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/gi;

/** Unique case UUIDs linked in message body (teaching case cards). */
export function extractCaseIdsFromMessageBody(body: string | null | undefined): string[] {
  if (!body?.trim()) return [];
  const ids = new Set<string>();
  for (const match of body.matchAll(CASE_PATH)) {
    const id = match[1];
    if (id) ids.add(id.toLowerCase());
  }
  return [...ids];
}
