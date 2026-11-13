import { NextResponse } from "next/server";

import { safeLog } from "@/lib/security/safeLog";

/**
 * SECURITY: never return stack traces / SQL / internal details to clients.
 */
export function apiErrorResponse(
  publicMessage: string,
  status: number,
  logContext?: { route?: string; err?: unknown },
): NextResponse {
  if (logContext?.err !== undefined) {
    safeLog("api error", {
      route: logContext.route,
      message: logContext.err instanceof Error ? logContext.err.message : "unknown",
    });
  }
  return NextResponse.json({ error: publicMessage }, { status });
}
