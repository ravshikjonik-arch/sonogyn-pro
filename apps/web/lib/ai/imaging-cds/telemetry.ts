import { isImagingCdsHintTelemetryEnabled } from "./flags";

export type ImagingCdsTelemetryPayload = {
  domain: "gyn" | "breast";
  kind: "hint_feedback" | "applicability_block" | "qc_warn";
  aiCategoryNumber?: number | null;
  manualCategoryNumber?: number | null;
  applicabilityCode?: string;
  qcCodes?: string[];
};

/** No PHI — category deltas only. Server route logs when flag enabled. */
export async function sendImagingCdsTelemetry(payload: ImagingCdsTelemetryPayload): Promise<void> {
  if (!isImagingCdsHintTelemetryEnabled()) return;
  if (typeof window === "undefined") return;

  try {
    await fetch("/api/ai/imaging-cds-telemetry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
  } catch {
    /* non-blocking */
  }
}
