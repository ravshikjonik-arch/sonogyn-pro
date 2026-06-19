import { prisma } from "@/lib/prisma";

export type SmsRateLimitResult =
  | { ok: true }
  | { ok: false; error: string; retryAfterSec?: number };

/** Не чаще 1 SMS/мин и не более 5 SMS/час на номер. */
export async function checkSmsSendRateLimit(phone: string): Promise<SmsRateLimitResult> {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const recent = await prisma.sMSVerification.findFirst({
    where: { phone, createdAt: { gte: oneMinuteAgo } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  if (recent) {
    const elapsedMs = Date.now() - recent.createdAt.getTime();
    const retryAfterSec = Math.max(1, Math.ceil((60_000 - elapsedMs) / 1000));
    return {
      ok: false,
      error: "Слишком часто. Подождите 1 минуту перед повторной отправкой.",
      retryAfterSec,
    };
  }

  const hourAgo = new Date(Date.now() - 3_600_000);
  const hourlyCount = await prisma.sMSVerification.count({
    where: { phone, createdAt: { gte: hourAgo } },
  });

  if (hourlyCount >= 5) {
    return {
      ok: false,
      error: "Превышен лимит: не более 5 SMS в час на один номер.",
    };
  }

  return { ok: true };
}
