import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { emptyStructuredProtocolDraft } from "@repo/types";

import { computeProtocolContentHash } from "../protocol-content-hash";
import { validateProtocolLifecycleBody } from "../protocol-lifecycle-service";
import { isProtocolDraftEditable } from "../protocol-lifecycle-labels";

describe("computeProtocolContentHash", () => {
  it("returns stable sha256 hex", () => {
    const draft = emptyStructuredProtocolDraft();
    draft.algorithmVersion = "2022";
    const a = computeProtocolContentHash(draft);
    const b = computeProtocolContentHash(draft);
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  it("changes when sections change", () => {
    const draft = emptyStructuredProtocolDraft();
    const before = computeProtocolContentHash(draft);
    draft.sections.description = { plain: "test", blocks: [], mediaRefs: [] };
    const after = computeProtocolContentHash(draft);
    assert.notEqual(before, after);
  });
});

describe("validateProtocolLifecycleBody", () => {
  it("requires amendment reason", () => {
    const result = validateProtocolLifecycleBody({ action: "amend" });
    assert.ok(result && !result.ok);
    assert.equal(result.code, "amendment_reason_required");
  });

  it("accepts valid amend", () => {
    assert.equal(
      validateProtocolLifecycleBody({ action: "amend", amendmentReason: "Уточнение размеров" }),
      null,
    );
  });
});

describe("isProtocolDraftEditable", () => {
  it("blocks finalized and archived", () => {
    assert.equal(isProtocolDraftEditable("finalized"), false);
    assert.equal(isProtocolDraftEditable("archived"), false);
    assert.equal(isProtocolDraftEditable("draft"), true);
    assert.equal(isProtocolDraftEditable("review"), true);
  });
});
