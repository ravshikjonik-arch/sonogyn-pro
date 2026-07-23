import { timingSafeEqual } from "@/lib/security/timing-safe";

/**
 * Auth for Telegram → teaching-example ingest.
 * Requires TELEGRAM_EXAMPLE_INGEST_SECRET in production.
 */
export function isTelegramExampleIngestAuthorized(req: Request): boolean {
  const secret = process.env.TELEGRAM_EXAMPLE_INGEST_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  const auth = req.headers.get("authorization")?.trim() ?? "";
  if (auth.startsWith("Bearer ") && timingSafeEqual(secret, auth.slice(7).trim())) {
    return true;
  }

  const header = req.headers.get("x-sonogyn-telegram-example-secret")?.trim() ?? "";
  return timingSafeEqual(secret, header);
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
