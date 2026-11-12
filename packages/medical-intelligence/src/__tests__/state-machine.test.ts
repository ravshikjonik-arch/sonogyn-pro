import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { IllegalTransitionError, MI_TERMINAL_STATES, MI_TRANSITIONS, createWorkflowTrace } from "../state-machine";

describe("MI workflow state machine", () => {
  it("terminal states have no outgoing transitions", () => {
    for (const s of MI_TERMINAL_STATES) assert.deepEqual(MI_TRANSITIONS[s], [], s);
  });

  it("follows a legal path and records reasons", () => {
    const t = createWorkflowTrace(() => "t");
    t.to("validating");
    t.to("ready_for_classification");
    t.to("classifying");
    t.to("completed", "classified");
    assert.equal(t.current, "completed");
    assert.equal(t.isTerminal(), true);
    assert.deepEqual(t.history.at(-1), { state: "completed", at: "t", reason: "classified" });
  });

  it("rejects illegal transitions (e.g. extraction straight to classification, leaving a terminal state)", () => {
    const t = createWorkflowTrace(() => "t");
    assert.throws(() => t.to("classifying"), IllegalTransitionError);
    t.to("validating");
    t.to("extracting");
    assert.throws(() => t.to("classifying"), IllegalTransitionError, "AI extraction can never feed classification directly");
    t.to("awaiting_physician_review");
    assert.throws(() => t.to("completed"), IllegalTransitionError);
  });

  it("incomplete / blocked / failed / awaiting review are distinct terminal outcomes", () => {
    assert.equal(new Set(MI_TERMINAL_STATES).size, 5);
    assert.ok(MI_TRANSITIONS.classifying.includes("incomplete"));
    assert.ok(MI_TRANSITIONS.classifying.includes("awaiting_physician_review"));
    assert.ok(!MI_TRANSITIONS.extracting.includes("ready_for_classification"));
  });
});
