import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { canTransitionLifecycle } from "@repo/types";

describe("case lifecycle state machine", () => {
  it("open → discussion via first comment (implicit)", () => {
    assert.equal(canTransitionLifecycle("open", "resolve"), true);
  });

  it("confirmed cannot resolve without reopen", () => {
    assert.equal(canTransitionLifecycle("confirmed", "resolve"), false);
  });

  it("publish_knowledge_base only from confirmed", () => {
    assert.equal(canTransitionLifecycle("confirmed", "publish_knowledge_base"), true);
    assert.equal(canTransitionLifecycle("discussion", "publish_knowledge_base"), false);
  });
});
