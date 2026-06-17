const SECRET_KEY_FRAGMENTS = [
  "secret",
  "token",
  "password",
  "authorization",
  "api_key",
  "apikey",
  "bearer",
  "credential",
  "private_key",
  "service_role",
];

const PHI_KEY_FRAGMENTS = [
  "display_label",
  "full_name",
  "phone",
  "email",
  "lmp",
  "date_of_birth",
  "external_ref",
  "snils",
  "oms",
  "body",
  "conclusion",
  "diagnosis",
  "patient",
  "payload",
  "protocol",
  "biometry",
  "meta",
  "study_id",
  "patient_id",
  "reporttext",
  "report_text",
  "name",
  "address",
];

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_RE = /(?:\+?\d[\s()\-]*){8,}/g;
const UUID_RE = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi;
const SNILS_RE = /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/g;
const OMS_RE = /\b\d{16}\b/g;

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase();
  return (
    SECRET_KEY_FRAGMENTS.some((part) => normalized.includes(part)) ||
    PHI_KEY_FRAGMENTS.some((part) => normalized.includes(part))
  );
}

export function redactText(value: string): string {
  return value
    .replace(EMAIL_RE, "[redacted-email]")
    .replace(PHONE_RE, "[redacted-phone]")
    .replace(UUID_RE, "[redacted-id]")
    .replace(SNILS_RE, "[redacted-snils]")
    .replace(OMS_RE, "[redacted-oms]");
}

export function redactTelemetryValue(key: string, value: unknown): unknown {
  if (isSensitiveKey(key)) return "[redacted]";
  if (typeof value === "string") return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactTelemetryValue(key, item));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [childKey, childValue] of Object.entries(value as Record<string, unknown>)) {
      out[childKey] = redactTelemetryValue(childKey, childValue);
    }
    return out;
  }
  return value;
}

export function redactTelemetryContext(context?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    out[key] = redactTelemetryValue(key, value);
  }
  return out;
}
