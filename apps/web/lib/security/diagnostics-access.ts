/** Full infra/auth diagnostics — only dev or internal ops (pilot-smoke with secret). */
import { timingSafeEqual } from "@/lib/security/timing-safe";

export function isFullDiagnosticsAllowed(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.SONOGYN_AUTH_INTERNAL_SECRET?.trim();
  if (!secret) return false;
  const received = req.headers.get("x-sonogyn-internal-secret") ?? "";
  return timingSafeEqual(secret, received);
}
