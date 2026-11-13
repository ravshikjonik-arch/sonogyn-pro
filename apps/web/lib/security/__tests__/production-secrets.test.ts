import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getProductionSecretViolations } from "../production-secrets";

describe("getProductionSecretViolations", () => {
  it("is empty outside production", () => {
    assert.deepEqual(
      getProductionSecretViolations({
        NODE_ENV: "development",
        AUTH_RATE_LIMIT_RELAXED: "true",
      } as NodeJS.ProcessEnv),
      [],
    );
  });

  it("flags AUTH_RATE_LIMIT_RELAXED in production", () => {
    const violations = getProductionSecretViolations({
      NODE_ENV: "production",
      AUTH_RATE_LIMIT_RELAXED: "true",
      SONOGYN_AUTH_INTERNAL_SECRET: "x".repeat(40),
      SUPABASE_SERVICE_ROLE_KEY: "srk",
      PLAYBACK_TOKEN_SECRET: "y".repeat(40),
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "token",
    } as NodeJS.ProcessEnv);

    assert.ok(
      violations.some((v) => v.includes("AUTH_RATE_LIMIT_RELAXED")),
      `expected AUTH_RATE_LIMIT_RELAXED violation, got: ${violations.join("; ")}`,
    );
  });
});
