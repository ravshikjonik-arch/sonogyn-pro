import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveAuthorTrust } from "../resolve-author-trust";

describe("resolveAuthorTrust", () => {
  it("maps badges from get_author_public_badges RPC", async () => {
    const supabase = {
      rpc: async (name: string, args: { p_user_ids: string[] }) => {
        assert.equal(name, "get_author_public_badges");
        assert.deepEqual(args.p_user_ids, ["a", "b"]);
        return {
          data: [
            { id: "a", is_verified: true, reputation: 12 },
            { id: "b", is_verified: false, reputation: 0 },
          ],
          error: null,
        };
      },
    };

    const map = await resolveAuthorTrust(supabase as never, ["a", "b", "a"]);
    assert.equal(map.a?.isVerified, true);
    assert.equal(map.a?.reputation, 12);
    assert.equal(map.b?.isVerified, false);
  });

  it("defaults missing ids when RPC fails", async () => {
    const supabase = {
      rpc: async () => ({ data: null, error: { message: "missing fn" } }),
    };
    const map = await resolveAuthorTrust(supabase as never, ["x"]);
    assert.deepEqual(map.x, { isVerified: false, reputation: 0 });
  });
});
