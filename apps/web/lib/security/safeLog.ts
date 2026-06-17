/** Never log PHI or secrets — strip identifiers and credential fields from diagnostics. */

import { redactTelemetryContext } from "@/lib/security/pii-redaction";

export function safeLog(message: string, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === "production") return;
  if (!context) {
    console.info(`[clinical] ${message}`);
    return;
  }
  console.info(`[clinical] ${message}`, redactTelemetryContext(context));
}
