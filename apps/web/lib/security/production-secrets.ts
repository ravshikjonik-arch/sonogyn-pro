const INSECURE_INTERNAL_SECRETS = new Set([
  "dev-internal-auth-secret-change-me",
  "change-me",
  "secret",
]);

/**
 * Production guard: reject default Telegram bot internal secret.
 * Call from middleware (edge-safe, no throw — log only).
 */
export function assertProductionSecretsConfigured(): void {
  if (process.env.NODE_ENV !== "production") return;

  const internal = process.env.SONOGYN_AUTH_INTERNAL_SECRET?.trim();
  if (!internal || INSECURE_INTERNAL_SECRETS.has(internal) || internal.length < 32) {
    console.error(
      "[security] SONOGYN_AUTH_INTERNAL_SECRET must be a random string ≥32 chars in production.",
    );
  }
}

export function isInternalAuthSecretConfigured(): boolean {
  const expected = process.env.SONOGYN_AUTH_INTERNAL_SECRET?.trim();
  if (!expected || INSECURE_INTERNAL_SECRETS.has(expected)) return false;
  if (process.env.NODE_ENV === "production" && expected.length < 32) return false;
  return true;
}
