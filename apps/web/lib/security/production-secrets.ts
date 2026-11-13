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

function upstashConfiguredFrom(env: NodeJS.ProcessEnv): boolean {
  if (env === process.env) return isUpstashRestConfigured();
  const url = env.UPSTASH_REDIS_REST_URL?.trim() || env.KV_REST_API_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim() || env.KV_REST_API_TOKEN?.trim();
  return Boolean(url && token);
}

/** Violations that must be fixed before production deploy. */
export function getProductionSecretViolations(env: NodeJS.ProcessEnv = process.env): string[] {
  if (env.NODE_ENV !== "production") return [];

  const violations: string[] = [];

  if (isWeakInternalSecret(env.SONOGYN_AUTH_INTERNAL_SECRET)) {
    violations.push(
      `SONOGYN_AUTH_INTERNAL_SECRET must be a random string ≥${MIN_INTERNAL_SECRET_LEN} chars (not a default placeholder)`,
    );
  }

  if (!upstashConfiguredFrom(env)) {
    violations.push(
      "Upstash Redis REST credentials required (UPSTASH_REDIS_REST_* or KV_REST_API_URL + KV_REST_API_TOKEN)",
    );
  }

  if (!env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    violations.push("SUPABASE_SERVICE_ROLE_KEY is required in production for admin auth flows");
  }

  if (env.DEV_SKIP_AUTH === "true") {
    violations.push("DEV_SKIP_AUTH must not be true in production (remove from Vercel env)");
  }

  if (env.DEV_AUTO_LOGIN === "true") {
    violations.push("DEV_AUTO_LOGIN must not be true in production (remove from Vercel env)");
  }

  if (env.DEV_AUTH_MODE === "true") {
    violations.push("DEV_AUTH_MODE must not be true in production (remove from Vercel env)");
  }

  if (env.AUTH_RATE_LIMIT_RELAXED === "true") {
    violations.push(
      "AUTH_RATE_LIMIT_RELAXED must not be true in production (removes auth brute-force protection)",
    );
  }

  if (!env.PLAYBACK_TOKEN_SECRET?.trim()) {
    violations.push("PLAYBACK_TOKEN_SECRET must be set in production (random string ≥32 chars)");
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
  return isUpstashRestConfigured();
}
