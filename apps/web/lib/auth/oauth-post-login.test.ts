import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { User } from "@supabase/supabase-js";

import { extractOAuthDisplayName, isClinicalProfileReady } from "./oauth-post-login";

function userWithMeta(meta: Record<string, unknown>): User {
  return { id: "u1", user_metadata: meta } as User;
}

describe("oauth-post-login", () => {
  it("extracts Yandex-style family + given name", () => {
    assert.equal(
      extractOAuthDisplayName(
        userWithMeta({ family_name: "Якубов", given_name: "Равшан", middle_name: "Вахобжонович" }),
      ),
      "Якубов Равшан Вахобжонович",
    );
  });

  it("prefers full_name when present", () => {
    assert.equal(
      extractOAuthDisplayName(userWithMeta({ full_name: "Иванова А.А.", name: "other" })),
      "Иванова А.А.",
    );
  });

  it("requires name and specialization for clinical ready", () => {
    assert.equal(isClinicalProfileReady({ full_name: "A", specialization: "УЗИ" }), true);
    assert.equal(isClinicalProfileReady({ full_name: "A", specialization: "" }), false);
    assert.equal(isClinicalProfileReady({ full_name: null, specialization: "УЗИ" }), false);
  });
});
