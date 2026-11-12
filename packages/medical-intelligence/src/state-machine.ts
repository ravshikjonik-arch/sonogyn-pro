import type { MiStatus, MiWorkflowState } from "./contracts";

/** Allowed transitions. Anything else throws — transitions are deterministic and tested. */
export const MI_TRANSITIONS: Readonly<Record<MiWorkflowState, readonly MiWorkflowState[]>> = {
  received: ["validating"],
  validating: [
    "extracting",
    "awaiting_physician_review",
    "ready_for_classification",
    "retrieving_evidence",
    "incomplete",
    "blocked",
    "failed",
  ],
  extracting: ["awaiting_physician_review", "incomplete", "blocked", "failed"],
  ready_for_classification: ["classifying", "completed", "failed"],
  classifying: ["retrieving_evidence", "completed", "incomplete", "awaiting_physician_review", "blocked", "failed"],
  retrieving_evidence: ["completed", "failed", "blocked"],
  awaiting_physician_review: [],
  completed: [],
  incomplete: [],
  blocked: [],
  failed: [],
};

export const MI_TERMINAL_STATES: readonly MiStatus[] = [
  "completed",
  "incomplete",
  "blocked",
  "failed",
  "awaiting_physician_review",
];

export class IllegalTransitionError extends Error {
  constructor(from: MiWorkflowState, to: MiWorkflowState) {
    super(`Illegal MI workflow transition ${from} → ${to}`);
    this.name = "IllegalTransitionError";
  }
}

export type WorkflowTrace = {
  readonly current: MiWorkflowState;
  readonly history: { state: MiWorkflowState; at: string; reason?: string }[];
  to(next: MiWorkflowState, reason?: string): void;
  isTerminal(): boolean;
};

export function createWorkflowTrace(now: () => string): WorkflowTrace {
  const history: { state: MiWorkflowState; at: string; reason?: string }[] = [{ state: "received", at: now() }];
  let current: MiWorkflowState = "received";
  return {
    get current() {
      return current;
    },
    history,
    to(next, reason) {
      if (!MI_TRANSITIONS[current].includes(next)) throw new IllegalTransitionError(current, next);
      current = next;
      history.push(reason ? { state: next, at: now(), reason } : { state: next, at: now() });
    },
    isTerminal() {
      return (MI_TERMINAL_STATES as readonly string[]).includes(current);
    },
  };
}
