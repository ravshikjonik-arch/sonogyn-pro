import { timingSafeEqual } from "@/lib/security/timing-safe";

/**
 * Авторизация внутренних вызовов: cron, /api/notify.
 * Production: CRON_SECRET и/или SONOGYN_AUTH_INTERNAL_SECRET обязателен.
 */
export function isInternalNotifyAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const internalSecret = process.env.SONOGYN_AUTH_INTERNAL_SECRET?.trim();

  if (!cronSecret && !internalSecret) {
    return process.env.NODE_ENV !== "production";
  }

  if (cronSecret) {
    const auth = req.headers.get("authorization")?.trim();
    if (auth === `Bearer ${cronSecret}`) return true;
    if (req.headers.get("x-cron-secret")?.trim() === cronSecret) return true;
  }

  if (internalSecret) {
    const received = req.headers.get("x-sonogyn-internal-secret") ?? "";
    if (timingSafeEqual(internalSecret, received)) return true;
  }

  return false;
}
