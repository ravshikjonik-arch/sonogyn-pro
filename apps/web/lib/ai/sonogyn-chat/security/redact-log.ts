/** Redact clinical chat payloads before any diagnostic logging. */

const SENSITIVE_KEYS = [
  "content",
  "message",
  "messages",
  "prompt",
  "systemprompt",
  "body",
  "data",
  "image",
  "images",
  "base64",
  "protocol",
  "conclusion",
  "diagnosis",
  "patient",
  "full_name",
  "phone",
  "email",
  "snils",
  "polis",
];

function isSensitiveKey(key: string): boolean {
  const k = key.toLowerCase();
  return SENSITIVE_KEYS.some((p) => k.includes(p));
}

export function redactForAiLog(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth-limit]";
  if (value == null) return value;
  if (typeof value === "string") {
    return value.length > 120 ? `[redacted:${value.length}chars]` : "[redacted]";
  }
  if (Array.isArray(value)) {
    return value.slice(0, 8).map((v) => redactForAiLog(v, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = isSensitiveKey(k) ? "[redacted]" : redactForAiLog(v, depth + 1);
    }
    return out;
  }
  return value;
}
