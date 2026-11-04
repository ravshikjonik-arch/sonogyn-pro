import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { assertAiChatQuota } from "../cost-control";
import { FREE_AI_LIMIT } from "@/lib/pro/ai-usage";

describe("assertAiChatQuota fail-closed", () => {
  const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const prevKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
    if (prevKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });

  it("denies when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const result = await assertAiChatQuota("00000000-0000-4000-8000-000000000001");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.used, 0);
      assert.equal(result.limit, FREE_AI_LIMIT);
    }
  });

  it("denies when NEXT_PUBLIC_SUPABASE_URL is missing", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";

    const result = await assertAiChatQuota("00000000-0000-4000-8000-000000000001");
    assert.equal(result.ok, false);
  });
});
