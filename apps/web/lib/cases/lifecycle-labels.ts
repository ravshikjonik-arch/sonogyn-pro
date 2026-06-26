/** IA v2 CASE lifecycle display helpers (parallel to legacy status). */

export type CaseLifecycleStatus = "open" | "discussion" | "resolved" | "confirmed" | "archived";

const LABELS: Record<CaseLifecycleStatus, string> = {
  open: "OPEN",
  discussion: "DISCUSSION",
  resolved: "RESOLVED",
  confirmed: "CONFIRMED",
  archived: "ARCHIVED",
};

export function formatLifecycleLabel(status: string | null | undefined): string | null {
  if (!status) return null;
  return LABELS[status as CaseLifecycleStatus] ?? status.toUpperCase();
}

/** Fallback when lifecycle_status column not migrated yet. */
export function inferLifecycleFromLegacy(status: string): CaseLifecycleStatus {
  if (status === "flagged") return "archived";
  if (status === "review") return "discussion";
  return "open";
}

export function resolveCaseLifecycle(
  lifecycleStatus: string | null | undefined,
  legacyStatus: string,
): CaseLifecycleStatus {
  if (
    lifecycleStatus === "open" ||
    lifecycleStatus === "discussion" ||
    lifecycleStatus === "resolved" ||
    lifecycleStatus === "confirmed" ||
    lifecycleStatus === "archived"
  ) {
    return lifecycleStatus;
  }
  return inferLifecycleFromLegacy(legacyStatus);
}
