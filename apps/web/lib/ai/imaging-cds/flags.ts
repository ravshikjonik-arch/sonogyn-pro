/** Clinical imaging CDS v2 — QC, de-ID, no direct category from vision. */

function envTruthy(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Master switch for prepare-frames QC + vision sanitization (default on). */
export function isImagingCdsV2Enabled(): boolean {
  const off = process.env.IMAGING_CDS_V2?.trim().toLowerCase();
  if (off === "0" || off === "false" || off === "off") return false;
  return true;
}

/** Block /api/ai/*-assist when QC fails (default off — warn only). */
export function isImagingCdsStrictQcEnabled(): boolean {
  return envTruthy(process.env.IMAGING_CDS_STRICT_QC);
}

/** Log AI vs physician hint deltas (no PHI) — future telemetry hook. */
export function isImagingCdsHintTelemetryEnabled(): boolean {
  return envTruthy(process.env.IMAGING_CDS_HINT_TELEMETRY);
}
