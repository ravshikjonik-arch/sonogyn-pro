const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\s()\-]*){8,}/g;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const SNILS_RE = /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/g;
const OMS_RE = /\b\d{16}\b/g;

const SENSITIVE_KEYS = [
  "patient",
  "display_label",
  "full_name",
  "phone",
  "email",
  "payload",
  "protocol",
  "diagnosis",
  "conclusion",
  "token",
  "password",
  "secret",
];

export function redactText(value: string): string {
  return value
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(PHONE_RE, "[redacted-phone]")
    .replace(UUID_RE, "[redacted-id]")
    .replace(SNILS_RE, "[redacted-snils]")
    .replace(OMS_RE, "[redacted-oms]");
}

export function redactError(error: unknown): string {
  if (error instanceof Error) return redactText(error.message);
  if (typeof error === "string") return redactText(error);
  return "redacted-error";
}

export function redactObject<T>(value: T): T | string {
  if (!value || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redactObject(item)) as T;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((part) => key.toLowerCase().includes(part))) {
      out[key] = "[redacted]";
    } else if (typeof child === "string") {
      out[key] = redactText(child);
    } else {
      out[key] = redactObject(child);
    }
  }
  return out as T;
}
