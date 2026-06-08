/**
 * Restricts open redirects after auth — only same-origin relative paths are allowed.
 */
export function safeInternalPath(raw: string | null, fallback = "/app"): string {
  if (!raw || typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\")) return fallback;
  return trimmed;
}
