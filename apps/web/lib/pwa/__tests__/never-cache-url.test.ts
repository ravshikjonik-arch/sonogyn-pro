import assert from "node:assert/strict";
import test from "node:test";

import { shouldNeverCacheRequest } from "../never-cache-url";

test("shouldNeverCacheRequest blocks Supabase and API", () => {
  assert.equal(
    shouldNeverCacheRequest(new URL("https://grnwcbyslttbrqznnunq.supabase.co/rest/v1/profiles"), "/rest/v1/profiles"),
    true,
  );
  assert.equal(
    shouldNeverCacheRequest(new URL("https://example.com/api/ai/chat"), "/api/ai/chat"),
    true,
  );
  assert.equal(
    shouldNeverCacheRequest(new URL("https://example.com/profile/patients/abc"), "/profile/patients/abc"),
    true,
  );
  assert.equal(
    shouldNeverCacheRequest(new URL("https://example.com/auth/callback"), "/auth/callback"),
    true,
  );
});

test("shouldNeverCacheRequest allows calculator pages", () => {
  assert.equal(
    shouldNeverCacheRequest(new URL("https://sonogyn-pro.ru/tools/calc/rads/o-rads"), "/tools/calc/rads/o-rads"),
    false,
  );
  assert.equal(shouldNeverCacheRequest(new URL("https://sonogyn-pro.ru/home"), "/home"), false);
});
