import { describe, expect, it } from "vitest";

import { resolveDoctorChatLoadState } from "./resolve-doctor-chat-load-state";

describe("resolveDoctorChatLoadState", () => {
  it("guest → auth_required with login CTA", () => {
    const state = resolveDoctorChatLoadState({
      hasUser: false,
      httpStatus: null,
      errorMessage: null,
    });
    expect(state?.kind).toBe("auth_required");
    expect(state?.showLoginCta).toBe(true);
    expect(state?.showMigrationHint).toBe(false);
  });

  it("403 → community access, not migration", () => {
    const state = resolveDoctorChatLoadState({
      hasUser: true,
      httpStatus: 403,
      errorMessage: "Forbidden",
    });
    expect(state?.kind).toBe("community_access");
    expect(state?.showMigrationHint).toBe(false);
  });

  it("doctor_chat in message → migration hint", () => {
    const state = resolveDoctorChatLoadState({
      hasUser: true,
      httpStatus: 500,
      errorMessage: 'relation "doctor_chat_messages" does not exist',
    });
    expect(state?.kind).toBe("migration");
    expect(state?.showMigrationHint).toBe(true);
  });

  it("ok load → null", () => {
    const state = resolveDoctorChatLoadState({
      hasUser: true,
      httpStatus: 200,
      errorMessage: null,
    });
    expect(state).toBeNull();
  });
});
