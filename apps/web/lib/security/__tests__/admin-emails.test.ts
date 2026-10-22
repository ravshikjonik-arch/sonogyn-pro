import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { isAdminEmail, parseAdminEmailsEnv } from "../admin-emails.js";

const env = process.env;

describe("admin-emails", () => {
  afterEach(() => {
    process.env = env;
  });

  it("parses comma-separated emails", () => {
    const set = parseAdminEmailsEnv("Mod@Example.com, other@test.org");
    assert.equal(set.has("mod@example.com"), true);
    assert.equal(set.has("other@test.org"), true);
  });

  it("isAdminEmail uses process env when set", () => {
    process.env.ADMIN_EMAILS = "trust@sonogyn.test";
    assert.equal(isAdminEmail("trust@sonogyn.test"), true);
    assert.equal(isAdminEmail("other@test.org"), false);
  });
});
