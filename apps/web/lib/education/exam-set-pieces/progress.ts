export const SET_PIECE_PROGRESS_KEY = "sonogyn:exam-set-pieces:completed";

export function loadSetPieceCompleted(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(SET_PIECE_PROGRESS_KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function setSetPieceCompleted(scenarioId: string, done: boolean): void {
  const progress = loadSetPieceCompleted();
  if (done) progress[scenarioId] = true;
  else delete progress[scenarioId];
  localStorage.setItem(SET_PIECE_PROGRESS_KEY, JSON.stringify(progress));
}
