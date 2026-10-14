/**
 * Integration rollout flags (audit stages 1–6).
 * Default: off — enable per-module on staging, then prod.
 */

function envTruthy(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Cornerstone3D in-app viewer (workspace + case media). */
export function isDicomViewerEnabled(): boolean {
  return envTruthy(process.env.DICOM_VIEWER_ENABLED);
}

export function isDicomViewerEnabledClient(): boolean {
  return envTruthy(process.env.NEXT_PUBLIC_DICOM_VIEWER_ENABLED);
}

/** Require server DICOM de-ID before case publish (gate R6 extension). */
export function isDicomDeidRequired(): boolean {
  return envTruthy(process.env.DICOM_DEID_REQUIRED);
}

/** Restore 10s polling in case discussion (rollback for Realtime). */
export function isRealtimePollingFallbackEnabled(): boolean {
  return envTruthy(process.env.REALTIME_POLLING_FALLBACK);
}

/** Client-side rollback (set on Vercel with REALTIME_POLLING_FALLBACK). */
export function isRealtimePollingFallbackEnabledClient(): boolean {
  return (
    envTruthy(process.env.NEXT_PUBLIC_REALTIME_POLLING_FALLBACK) ||
    envTruthy(process.env.REALTIME_POLLING_FALLBACK)
  );
}

export type IntegrationRolloutFlags = {
  dicomViewer: boolean;
  dicomDeidRequired: boolean;
  aiSdk: boolean;
  sentry: boolean;
  realtimePollingFallback: boolean;
};

/** Server-side snapshot for health/debug (no secrets). */
export function integrationRolloutSnapshot(): IntegrationRolloutFlags {
  // Lazy import to avoid circular deps with ai/sentry modules
  const aiSdk =
    envTruthy(process.env.AI_SDK_ENABLED) || envTruthy(process.env.NEXT_PUBLIC_AI_SDK_ENABLED);
  const sentry =
    envTruthy(process.env.SENTRY_ENABLED) &&
    Boolean(process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());

  return {
    dicomViewer: isDicomViewerEnabled(),
    dicomDeidRequired: isDicomDeidRequired(),
    aiSdk,
    sentry,
    realtimePollingFallback: isRealtimePollingFallbackEnabled(),
  };
}
