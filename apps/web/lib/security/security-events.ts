import type { NextRequest } from "next/server";

import { redactTelemetryContext } from "@/lib/security/pii-redaction";

export type SecurityEventName =
  | "api_bot_blocked"
  | "rate_limit_exceeded"
  | "bulk_download_suspected"
  | "unusual_region"
  | "offline_flush";

type SecurityEventInput = {
  event: SecurityEventName;
  severity?: "info" | "warning" | "critical";
  request?: NextRequest | Request;
  context?: Record<string, unknown>;
};

function requestContext(request?: NextRequest | Request): Record<string, unknown> {
  if (!request) return {};
  const headers = request.headers;
  const url = "nextUrl" in request ? request.nextUrl.pathname : new URL(request.url).pathname;
  return {
    path: url,
    method: request.method,
    userAgent: headers.get("user-agent") ?? "",
    country: headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? "",
    region: headers.get("x-vercel-ip-country-region") ?? "",
  };
}

export async function recordSecurityEvent(input: SecurityEventInput): Promise<void> {
  const payload = redactTelemetryContext({
    event: input.event,
    severity: input.severity ?? "warning",
    at: new Date().toISOString(),
    ...requestContext(input.request),
    ...(input.context ?? {}),
  });

  const webhookUrl = process.env.SECURITY_ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[security-event]", payload);
    }
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    // Never fail the request path because alert delivery failed.
  }
}
