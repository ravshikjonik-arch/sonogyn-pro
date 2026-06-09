/** Never log PHI or secrets — strip identifiers and credential fields from diagnostics. */

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

const PHI_KEYS = [
  "display_label",
  "full_name",
  "phone",
  "email",
  "lmp",
  "date_of_birth",
  "external_ref",
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
];

function isSecretKey(key: string): boolean {
  const k = key.toLowerCase();
  return SECRET_KEY_FRAGMENTS.some((p) => k.includes(p));
}

function redactValue(key: string, value: unknown): unknown {
  if (isSecretKey(key) || PHI_KEYS.some((p) => key.toLowerCase().includes(p))) {
    return "[redacted]";
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = redactValue(k, v);
    }
    return out;
  }
  return value;
}

export function safeLog(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") return;
  if (!context) {
    console.info(`[clinical] ${message}`);
    return;
  }
  const redacted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    redacted[k] = redactValue(k, v);
  }
  console.info(`[clinical] ${message}`, redacted);
}
