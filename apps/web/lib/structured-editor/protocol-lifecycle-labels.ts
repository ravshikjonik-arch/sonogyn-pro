import {
  PROTOCOL_LIFECYCLE_STATUS_LABELS,
  type ProtocolLifecycleStatus,
} from "@repo/types";

export function formatProtocolLifecycleLabel(status: string | null | undefined): string {
  if (!status) return PROTOCOL_LIFECYCLE_STATUS_LABELS.draft;
  return (
    PROTOCOL_LIFECYCLE_STATUS_LABELS[status as ProtocolLifecycleStatus] ?? status
  );
}

export function isProtocolDraftEditable(status: string | null | undefined): boolean {
  return status === "draft" || status === "review" || status === "amended" || !status;
}
