import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  isCiPlaceholderSupabase,
  isE2eCiStubMode,
  isE2eFixturesEnabled,
} from "../ci-stub";

const env = process.env;

describe("ci-stub helpers", () => {
  afterEach(() => {
    process.env = env;
  });

  it("detects CI placeholder Supabase URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    assert.equal(isCiPlaceholderSupabase(), true);
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    assert.equal(isCiPlaceholderSupabase(), false);
  });

  it("enables stub mode only with E2E fixtures + placeholder URL", () => {
    process.env.E2E_FIXTURES = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    assert.equal(isE2eCiStubMode(), true);

    process.env.E2E_FIXTURES = "false";
    assert.equal(isE2eFixturesEnabled(), false);
    assert.equal(isE2eCiStubMode(), false);
  });
});
