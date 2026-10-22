import { NextResponse } from "next/server";

import { isUsAiWorkerEnabled, probeUsAiWorkerHealth, readUsAiWorkerConfig } from "@/lib/ai/us-vision/worker-client";

export const runtime = "nodejs";

/** PRO UI: is DICOM/SonoNet worker reachable? */
export async function GET() {
  if (!isUsAiWorkerEnabled()) {
    return NextResponse.json({
      configured: false,
      available: false,
      reason: "US_AI_WORKER_ENABLED=false",
    });
  }

  const cfg = readUsAiWorkerConfig();
  if (!cfg) {
    return NextResponse.json({
      configured: false,
      available: false,
      reason: "US_AI_WORKER_URL or secret missing",
    });
  }

  const health = await probeUsAiWorkerHealth(cfg);
  return NextResponse.json({
    configured: true,
    available: health.ok,
    reason: health.ok ? null : health.reason,
  });
}
