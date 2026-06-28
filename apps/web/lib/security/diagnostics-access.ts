/** Full infra/auth diagnostics — only dev or internal ops (pilot-smoke with secret). */
export function isFullDiagnosticsAllowed(req: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const secret = process.env.SONOGYN_AUTH_INTERNAL_SECRET?.trim();
  if (!secret) return false;
  return req.headers.get("x-sonogyn-internal-secret") === secret;
}
