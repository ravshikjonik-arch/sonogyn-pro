export const FIRST_RUN_STORAGE_KEY = "sonogyn:first-run-onboarding:v1";

export type FirstRunStepId = "calculator" | "aiAssistant" | "protocolDraft";

export type FirstRunStatus = "idle" | "active" | "completed" | "skipped";

export type FirstRunState = {
  version: 1;
  status: FirstRunStatus;
  steps: Record<FirstRunStepId, boolean>;
  updatedAt: string;
};

const DEFAULT_STATE: FirstRunState = {
  version: 1,
  status: "idle",
  steps: {
    calculator: false,
    aiAssistant: false,
    protocolDraft: false,
  },
  updatedAt: new Date(0).toISOString(),
};

function nowIso(): string {
  return new Date().toISOString();
}

export function readFirstRunState(): FirstRunState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(FIRST_RUN_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as FirstRunState;
    if (parsed.version !== 1 || !parsed.steps) return { ...DEFAULT_STATE };
    return {
      version: 1,
      status: parsed.status ?? "idle",
      steps: {
        calculator: Boolean(parsed.steps.calculator),
        aiAssistant: Boolean(parsed.steps.aiAssistant),
        protocolDraft: Boolean(parsed.steps.protocolDraft),
      },
      updatedAt: parsed.updatedAt ?? nowIso(),
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeFirstRunState(state: FirstRunState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FIRST_RUN_STORAGE_KEY, JSON.stringify(state));
}

/** После успешной регистрации — показать онбординг один раз. */
export function beginFirstRunOnboarding(): void {
  const current = readFirstRunState();
  if (current.status === "completed" || current.status === "skipped") return;
  writeFirstRunState({
    ...current,
    status: "active",
    updatedAt: nowIso(),
  });
}

export function skipFirstRunOnboarding(): void {
  writeFirstRunState({
    ...readFirstRunState(),
    status: "skipped",
    updatedAt: nowIso(),
  });
}

export function markFirstRunStep(step: FirstRunStepId): FirstRunState {
  const current = readFirstRunState();
  if (current.status !== "active") return current;
  const steps = { ...current.steps, [step]: true };
  const allDone = steps.calculator && steps.aiAssistant && steps.protocolDraft;
  const next: FirstRunState = {
    ...current,
    steps,
    status: allDone ? "completed" : "active",
    updatedAt: nowIso(),
  };
  writeFirstRunState(next);
  return next;
}

export function syncFirstRunStepsFromPath(pathname: string): FirstRunState | null {
  const current = readFirstRunState();
  if (current.status !== "active") return null;

  let changed = false;
  const steps = { ...current.steps };

  if (!steps.calculator && (pathname.startsWith("/tools/calc") || pathname.startsWith("/calculators"))) {
    steps.calculator = true;
    changed = true;
  }
  if (
    !steps.aiAssistant &&
    (pathname.startsWith("/ai/consultants") ||
      pathname.startsWith("/assistant") ||
      pathname.startsWith("/ai/ask"))
  ) {
    steps.aiAssistant = true;
    changed = true;
  }
  if (!steps.protocolDraft && pathname.startsWith("/reports")) {
    steps.protocolDraft = true;
    changed = true;
  }

  if (!changed) return null;

  const allDone = steps.calculator && steps.aiAssistant && steps.protocolDraft;
  const next: FirstRunState = {
    ...current,
    steps,
    status: allDone ? "completed" : "active",
    updatedAt: nowIso(),
  };
  writeFirstRunState(next);
  return next;
}

export function firstRunProgressPercent(steps: FirstRunState["steps"]): number {
  const done = [steps.calculator, steps.aiAssistant, steps.protocolDraft].filter(Boolean).length;
  return Math.round((done / 3) * 100);
}
