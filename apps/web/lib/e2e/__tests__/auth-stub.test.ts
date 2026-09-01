import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  e2eStubUserFromRequest,
  e2eStubValidateSignIn,
} from "../auth-stub";

describe("e2e auth stub", () => {
  it("accepts doctor fixture credentials", () => {
    const result = e2eStubValidateSignIn("e2e.doctor@sonogyn.test", "E2eDoctorPass123!");
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.role, "doctor");
  });

  it("rejects invalid password", () => {
    const result = e2eStubValidateSignIn("e2e.doctor@sonogyn.test", "wrong");
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /Неверный email или пароль/);
  });

  it("reads session user from stub cookie", () => {
    const request = new Request("http://localhost/api/auth/session", {
      headers: { cookie: "sonogyn-e2e-auth=doctor" },
    });
    const user = e2eStubUserFromRequest(request);
    assert.ok(user);
    assert.equal(user.email, "e2e.doctor@sonogyn.test");
  });
});
