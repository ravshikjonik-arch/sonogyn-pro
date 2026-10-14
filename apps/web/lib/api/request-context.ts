import { randomUUID } from "node:crypto";

const REQUEST_ID_HEADER = "x-request-id";
const IDEMPOTENCY_KEY_HEADER = "idempotency-key";

/** Correlation / request ID for API routes (never contains PHI). */
export function resolveRequestId(request: Request): string {
  const fromHeader = request.headers.get(REQUEST_ID_HEADER)?.trim();
  if (fromHeader && fromHeader.length <= 128 && /^[\w.-]+$/.test(fromHeader)) {
    return fromHeader;
  }
  return randomUUID();
}

/** Optional idempotency key for critical mutations (max 128 chars). */
export function resolveIdempotencyKey(request: Request): string | null {
  const key = request.headers.get(IDEMPOTENCY_KEY_HEADER)?.trim();
  if (!key || key.length > 128) return null;
  if (!/^[\w.-]+$/.test(key)) return null;
  return key;
}

export function withRequestIdHeaders(requestId: string): HeadersInit {
  return { [REQUEST_ID_HEADER]: requestId };
}
