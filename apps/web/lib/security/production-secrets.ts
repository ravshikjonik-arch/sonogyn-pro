import { isUpstashRestConfigured } from "./upstash-env";

const INSECURE_INTERNAL_SECRETS = new Set([
  "dev-internal-auth-secret-change-me",
  "change-me",
  "secret",
]);

const MIN_INTERNAL_SECRET_LEN = 32;

function isWeakInternalSecret(value: string | undefined): boolean {
  const internal = value?.trim();
  if (!internal) return true;
  if (INSECURE_INTERNAL_SECRETS.has(internal)) return true;
  if (internal.length < MIN_INTERNAL_SECRET_LEN) return true;
  return false;
}

function isUpstashConfigured(): boolean {
  return isUpstashRestConfigured();
}

/** Violations that must be fixed before production deploy. */
export function getProductionSecretViolations(): string[] {
  if (process.env.NODE_ENV !== "production") return [];

  const violations: string[] = [];

  if (isWeakInternalSecret(process.env.SONOGYN_AUTH_INTERNAL_SECRET)) {
    violations.push(
      `SONOGYN_AUTH_INTERNAL_SECRET must be a random string ≥${MIN_INTERNAL_SECRET_LEN} chars (not a default placeholder)`,
    );
  }

  if (!isUpstashConfigured()) {
    violations.push(
      "Upstash Redis REST credentials required (UPSTASH_REDIS_REST_* or KV_REST_API_URL + KV_REST_API_TOKEN)",
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    violations.push("SUPABASE_SERVICE_ROLE_KEY is required in production for admin auth flows");
  }

  if (process.env.DEV_SKIP_AUTH === "true") {
    violations.push("DEV_SKIP_AUTH must not be true in production (remove from Vercel env)");
  }

  if (process.env.DEV_AUTO_LOGIN === "true") {
    violations.push("DEV_AUTO_LOGIN must not be true in production (remove from Vercel env)");
  }

  return violations;
}

/**
 * Production guard: fail fast on insecure configuration.
 * Called from middleware at cold start.
 */
export function assertProductionSecretsConfigured(): void {
  const violations = getProductionSecretViolations();
  if (violations.length === 0) return;

  const msg = `[security] Production misconfiguration: ${violations.join("; ")}`;
  console.error(msg);
  throw new Error(msg);
}

export function isInternalAuthSecretConfigured(): boolean {
  return !isWeakInternalSecret(process.env.SONOGYN_AUTH_INTERNAL_SECRET);
}

export function isProductionRateLimitReady(): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  return isUpstashConfigured();
}
