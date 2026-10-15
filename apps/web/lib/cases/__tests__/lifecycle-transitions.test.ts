import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  canTransitionLifecycle,
  CASE_LIFECYCLE_TRANSITIONS,
  type CaseLifecycleAction,
} from "@repo/types";

import {
  assertLifecycleTransitionAllowed,
  validateLifecycleTransitionBody,
} from "../lifecycle-service";

const ALL_STATUSES = ["open", "discussion", "resolved", "confirmed", "archived"] as const;

describe("CASE_LIFECYCLE_TRANSITIONS state machine", () => {
  for (const action of Object.keys(CASE_LIFECYCLE_TRANSITIONS) as CaseLifecycleAction[]) {
    const rule = CASE_LIFECYCLE_TRANSITIONS[action];
    it(`${action}: allows only declared from-statuses`, () => {
      for (const status of ALL_STATUSES) {
        const allowed = canTransitionLifecycle(status, action);
        if (rule.from.includes(status)) {
          assert.equal(allowed, true, `${action} should allow from ${status}`);
        } else if (action !== "publish_knowledge_base") {
          assert.equal(allowed, false, `${action} should deny from ${status}`);
        }
      }
    });
  }

  it("denies OPEN → CONFIRMED directly", () => {
    assert.equal(canTransitionLifecycle("open", "confirm"), false);
  });

  it("denies CONFIRMED → RESOLVED", () => {
    assert.equal(canTransitionLifecycle("confirmed", "resolve"), false);
  });

  it("denies ARCHIVED → RESOLVED without reopen", () => {
    assert.equal(canTransitionLifecycle("archived", "resolve"), false);
  });

  it("allows reopen from archived", () => {
    assert.equal(canTransitionLifecycle("archived", "reopen"), true);
  });
});

describe("assertLifecycleTransitionAllowed", () => {
  it("rejects confirm from open", () => {
    const result = assertLifecycleTransitionAllowed("open", "confirm");
    assert.ok(result && !result.ok);
    assert.equal(result.code, "invalid_transition");
  });
});

describe("validateLifecycleTransitionBody", () => {
  it("requires confirmation method on confirm", () => {
    const result = validateLifecycleTransitionBody({ action: "confirm" });
    assert.ok(result && !result.ok);
    assert.equal(result.code, "confirmation_method_required");
  });

  it("requires other explanation", () => {
    const result = validateLifecycleTransitionBody({
      action: "confirm",
      confirmationMethod: "other",
    });
    assert.ok(result && !result.ok);
    assert.equal(result.code, "confirmation_method_other_required");
  });

  it("requires substantive confirmed diagnosis", () => {
    const result = validateLifecycleTransitionBody({
      action: "confirm",
      confirmationMethod: "histology",
      confirmedDiagnosis: "  ",
    });
    assert.ok(result && !result.ok);
    assert.equal(result.code, "confirmed_diagnosis_required");
  });

  it("passes valid confirm payload", () => {
    const result = validateLifecycleTransitionBody({
      action: "confirm",
      confirmationMethod: "mri",
      confirmedDiagnosis: "Серозная киста, O-RADS 2",
    });
    assert.equal(result, null);
  });

  it("passes resolve without confirmation fields", () => {
    assert.equal(validateLifecycleTransitionBody({ action: "resolve" }), null);
  });
});
