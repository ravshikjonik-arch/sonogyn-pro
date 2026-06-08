/** Never log PHI — strip common patient identifiers from diagnostic messages. */

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
  "patient",
];

export function safeLog(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") return;
  if (!context) {
    console.info(`[clinical] ${message}`);
    return;
  }
  const redacted: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(context)) {
    redacted[k] = PHI_KEYS.some((p) => k.toLowerCase().includes(p)) ? "[redacted]" : v;
  }
  console.info(`[clinical] ${message}`, redacted);
}
