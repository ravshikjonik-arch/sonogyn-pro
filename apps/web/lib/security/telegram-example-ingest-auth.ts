import { timingSafeEqual } from "@/lib/security/timing-safe";

/**
 * Auth for Telegram → teaching-example ingest.
 * Requires TELEGRAM_EXAMPLE_INGEST_SECRET in production.
 */
export function isTelegramExampleIngestAuthorized(req: Request): boolean {
  const secret = process.env.TELEGRAM_EXAMPLE_INGEST_SECRET?.trim();
  if (!secret) {
    const allowed = process.env.NODE_ENV !== "production";
    if (!allowed) {
      console.warn("[telegram-example] unauthorized", { reason: "server_secret_missing" });
    }
    return allowed;
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth.startsWith("Bearer ") && timingSafeEqual(secret, auth.slice(7).trim())) {
    return true;
  }

  const headerCandidates = [
    req.headers.get("x-sonogyn-telegram-example-secret"),
    req.headers.get("x-telegram-bot-api-secret-token"),
    req.headers.get("x-hermes-secret"),
    req.headers.get("x-api-key"),
  ]
    .map((value) => value?.trim() ?? "")
    .filter(Boolean);

  const ok = headerCandidates.some((header) => timingSafeEqual(secret, header));
  if (!ok) {
    console.warn("[telegram-example] unauthorized", {
      reason: auth || headerCandidates.length ? "secret_mismatch" : "secret_header_missing",
      hasBearer: auth.startsWith("Bearer "),
      hasCustomHeader: headerCandidates.length > 0,
    });
  }
  return ok;
}

/** Comma-separated Telegram user IDs allowed to ingest examples. */
export function isTelegramExampleUserAllowed(telegramUserId: string): boolean {
  const raw =
    process.env.TELEGRAM_EXAMPLE_ALLOWED_USER_IDS?.trim() ||
    process.env.AUTH_PILOT_TELEGRAM_ALLOWLIST?.trim() ||
    "";
  if (!raw) return false;
  const allowed = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return allowed.has(telegramUserId.trim());
}
