import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasAuthenticatedDoctor, postOnboardingRouteCore } from "./mobileAuthGateCore";

describe("mobileAuthGate", () => {
  it("postOnboardingRouteCore sends to Main when session present", () => {
    assert.equal(
      postOnboardingRouteCore(
        {
        access_token: "x",
        refresh_token: "y",
        expires_in: 3600,
        token_type: "bearer",
        user: { id: "u1", is_anonymous: false } as never,
      },
        true,
      ),
      "Main",
    );
  });

  it("postOnboardingRouteCore sends to SupabaseAuth when required and no session", () => {
    assert.equal(postOnboardingRouteCore(null, true), "SupabaseAuth");
  });

  it("hasAuthenticatedDoctor rejects anonymous", () => {
    assert.equal(
      hasAuthenticatedDoctor({
        access_token: "x",
        refresh_token: "y",
        expires_in: 3600,
        token_type: "bearer",
        user: { id: "u1", is_anonymous: true } as never,
      }),
      false,
    );
  });
});
