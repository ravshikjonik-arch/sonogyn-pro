import { getOradsDecisionNode, ORADS_TREE_OPTIONAL_ENTRY_ID } from "../oradsDecisionTree";
import type { OradsTreeResult } from "../types";

import {
  appendOradsNavigatorStep,
  resolveOradsNavigatorViewFromPath,
  type OradsNavigatorState,
} from "./resolveView";

export type OradsNavigatorAction =
  | { type: "pick"; nodeId: string; optionId: string }
  | { type: "back" }
  | { type: "restart" }
  | { type: "modifier_start" }
  | { type: "modifier_pick"; optionId: string };

export const ORADS_NAVIGATOR_INITIAL_STATE: OradsNavigatorState = {
  path: [],
  showTechnicalGate: true,
  modifierMode: false,
  overrideResult: null,
};

export function oradsNavigatorReducer(
  state: OradsNavigatorState,
  action: OradsNavigatorAction,
): OradsNavigatorState {
  switch (action.type) {
    case "pick": {
      if (state.showTechnicalGate && action.nodeId === ORADS_TREE_OPTIONAL_ENTRY_ID) {
        if (action.optionId === "adequate") {
          return { ...state, showTechnicalGate: false };
        }
        return {
          ...state,
          showTechnicalGate: false,
          path: appendOradsNavigatorStep(state.path, action.nodeId, action.optionId),
        };
      }
      if (state.modifierMode) {
        const node = getOradsDecisionNode("step_modifier_ascites");
        const opt = node?.options.find((o) => o.id === action.optionId);
        if (opt?.result) {
          return { ...state, modifierMode: false, overrideResult: opt.result };
        }
        return state;
      }
      return { ...state, path: appendOradsNavigatorStep(state.path, action.nodeId, action.optionId) };
    }
    case "back": {
      if (state.overrideResult) return { ...state, overrideResult: null };
      if (state.modifierMode) return { ...state, modifierMode: false };
      if (state.path.length === 0) return state;
      return { ...state, path: state.path.slice(0, -1) };
    }
    case "restart":
      return { ...ORADS_NAVIGATOR_INITIAL_STATE };
    case "modifier_start":
      return { ...state, modifierMode: true, overrideResult: null };
    case "modifier_pick": {
      const node = getOradsDecisionNode("step_modifier_ascites");
      const opt = node?.options.find((o) => o.id === action.optionId);
      if (opt?.result) {
        return { ...state, modifierMode: false, overrideResult: opt.result };
      }
      return state;
    }
    default:
      return state;
  }
}

/** Terminal result from path or override (null while still in questions). */
export function getOradsNavigatorTerminalResult(state: OradsNavigatorState): OradsTreeResult | null {
  if (state.overrideResult) return state.overrideResult;
  const view = resolveOradsNavigatorViewFromPath(state.path);
  return view.kind === "result" ? view.result : null;
}
