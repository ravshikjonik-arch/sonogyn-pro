import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { oradsNavigatorReducer, ORADS_NAVIGATOR_INITIAL_STATE } from "./reducer";
import { resolveOradsNavigatorViewFromPath } from "./resolveView";

describe("oradsNavigatorReducer", () => {
  it("technical gate adequate clears gate without path step", () => {
    const next = oradsNavigatorReducer(ORADS_NAVIGATOR_INITIAL_STATE, {
      type: "pick",
      nodeId: "step0_technical",
      optionId: "adequate",
    });
    assert.equal(next.showTechnicalGate, false);
    assert.equal(next.path.length, 0);
  });

  it("walks to O-RADS 2 parovarian", () => {
    let state = oradsNavigatorReducer(ORADS_NAVIGATOR_INITIAL_STATE, {
      type: "pick",
      nodeId: "step0_technical",
      optionId: "adequate",
    });
    state = oradsNavigatorReducer(state, {
      type: "pick",
      nodeId: "step1_localization",
      optionId: "extraovarian",
    });
    state = oradsNavigatorReducer(state, {
      type: "pick",
      nodeId: "step1_extraovarian",
      optionId: "paraovarian",
    });

    const view = resolveOradsNavigatorViewFromPath(state.path);
    assert.equal(view.kind, "result");
    if (view.kind === "result") {
      assert.equal(view.result.categoryNumber, 2);
    }
  });

  it("back pops last path step", () => {
    let state = oradsNavigatorReducer(ORADS_NAVIGATOR_INITIAL_STATE, {
      type: "pick",
      nodeId: "step0_technical",
      optionId: "adequate",
    });
    state = oradsNavigatorReducer(state, {
      type: "pick",
      nodeId: "step1_localization",
      optionId: "ovarian",
    });
    assert.equal(state.path.length, 1);
    state = oradsNavigatorReducer(state, { type: "back" });
    assert.equal(state.path.length, 0);
  });
});
