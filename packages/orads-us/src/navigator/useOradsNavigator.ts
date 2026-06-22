import { useCallback, useMemo, useReducer, type Dispatch } from "react";

import { buildOradsPathSummary } from "../pathSummary";

import { oradsNavigatorReducer, ORADS_NAVIGATOR_INITIAL_STATE, type OradsNavigatorAction } from "./reducer";
import { resolveOradsNavigatorView, type OradsNavigatorState } from "./resolveView";

export type UseOradsNavigatorOptions = {
  /** Estimated steps for progress UI (default 6). */
  estimatedSteps?: number;
  /** Show O-RADS 0 technical adequacy gate first (default true). */
  showTechnicalGateOnStart?: boolean;
  /** i18n lookup for path summary lines. */
  translate?: (key: string) => string;
};

export type UseOradsNavigatorReturn = {
  state: OradsNavigatorState;
  dispatch: Dispatch<OradsNavigatorAction>;
  view: ReturnType<typeof resolveOradsNavigatorView>;
  pathSummary: string[];
  stepCurrent: number;
  estimatedSteps: number;
  canPopStep: boolean;
  pick: (nodeId: string, optionId: string) => void;
  back: () => void;
  restart: () => void;
  startAscitesModifier: () => void;
  applyHints: (
    hints: Array<{ nodeId: string; optionId: string; confidence?: "low" | "medium" | "high" }>,
    autoPickHigh?: boolean,
  ) => void;
};

export function useOradsNavigator(options: UseOradsNavigatorOptions = {}): UseOradsNavigatorReturn {
  const estimatedSteps = options.estimatedSteps ?? 6;
  const translate = options.translate ?? ((key: string) => key);

  const [state, dispatch] = useReducer(oradsNavigatorReducer, {
    ...ORADS_NAVIGATOR_INITIAL_STATE,
    showTechnicalGate: options.showTechnicalGateOnStart !== false,
  });

  const view = useMemo(() => resolveOradsNavigatorView(state), [state]);

  const pathSummary = useMemo(
    () => buildOradsPathSummary(state.path, translate),
    [state.path, translate],
  );

  const stepCurrent = Math.min(view.stepIndex, estimatedSteps);

  const canPopStep = state.path.length > 0 || Boolean(state.overrideResult) || state.modifierMode;

  const pick = useCallback((nodeId: string, optionId: string) => {
    dispatch({ type: "pick", nodeId, optionId });
  }, []);

  const back = useCallback(() => {
    dispatch({ type: "back" });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: "restart" });
  }, []);

  const startAscitesModifier = useCallback(() => {
    dispatch({ type: "modifier_start" });
  }, []);

  const applyHints = useCallback(
    (
      hints: Array<{ nodeId: string; optionId: string; confidence?: "low" | "medium" | "high" }>,
      autoPickHigh?: boolean,
    ) => {
      dispatch({ type: "apply_hints", hints, autoPickHigh });
    },
    [],
  );

  return {
    state,
    dispatch,
    view,
    pathSummary,
    stepCurrent,
    estimatedSteps,
    canPopStep,
    pick,
    back,
    restart,
    startAscitesModifier,
    applyHints,
  };
}

export type { OradsNavigatorAction, OradsNavigatorState };
