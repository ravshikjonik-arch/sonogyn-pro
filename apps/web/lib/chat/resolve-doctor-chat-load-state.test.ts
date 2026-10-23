import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveDoctorChatLoadState } from "./resolve-doctor-chat-load-state";

describe("resolveDoctorChatLoadState", () => {
  it("guest → auth_required with login CTA", () => {
    const state = resolveDoctorChatLoadState({
      hasUser: false,
      httpStatus: null,
      errorMessage: null,
    });
    assert.equal(state?.kind, "auth_required");
    assert.equal(state?.showLoginCta, true);
    assert.equal(state?.showMigrationHint, false);
  });

  it("403 → community access, not migration", () => {
    const state = resolveDoctorChatLoadState({
      hasUser: true,
      httpStatus: 403,
      errorMessage: "Forbidden",
    });
    assert.equal(state?.kind, "community_access");
    assert.equal(state?.showMigrationHint, false);
  });

  it("doctor_chat in message → migration hint", () => {
    const state = resolveDoctorChatLoadState({
      hasUser: true,
      httpStatus: 500,
      errorMessage: 'relation "doctor_chat_messages" does not exist',
    });
    assert.equal(state?.kind, "migration");
    assert.equal(state?.showMigrationHint, true);
  });

  it("ok load → null", () => {
    const state = resolveDoctorChatLoadState({
      hasUser: true,
      httpStatus: 200,
      errorMessage: null,
    });
    assert.equal(state, null);
  });
});
