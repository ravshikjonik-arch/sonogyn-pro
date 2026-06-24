import { NextResponse } from "next/server";

import { handleApiError } from "@/lib/api/error-handler";
import { isInternalNotifyAuthorized } from "@/lib/security/internal-notify-auth";
import { logInfo, snapshotAndResetCounters } from "@/services/logger";
import { TelegramService } from "@/services/telegram";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/**
 * Ежедневная сводка для админов: регистрации, платежи, ошибки за сутки.
 *
 * Запуск: Vercel Cron (см. vercel.json, 06:00 UTC) с заголовком
 * `Authorization: Bearer <CRON_SECRET>` или `x-sonogyn-internal-secret`.
 */
type Admin = ReturnType<typeof createServiceRoleClient>;

async function countRegistrations(admin: Admin, sinceIso: string): Promise<number> {
  const { count, error } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  return error ? 0 : count ?? 0;
}

async function countPayments(admin: Admin, sinceIso: string, status?: string): Promise<number> {
  let query = admin
    .from("payments")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sinceIso);
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  return error ? 0 : count ?? 0;
}

export async function GET(req: Request) {
  if (!isInternalNotifyAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createServiceRoleClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [registrations, paymentsTotal, paymentsSucceeded] = await Promise.all([
      countRegistrations(admin, since),
      countPayments(admin, since),
      countPayments(admin, since, "succeeded"),
    ]);

    const errors = snapshotAndResetCounters();

    const summary = {
      period: "24h",
      registrations,
      paymentsTotal,
      paymentsSucceeded,
      errors: errors.error,
      criticalErrors: errors.critical,
      warnings: errors.warn,
    };

    logInfo("cron/daily-summary", summary);

    await TelegramService.notifyAdmins("daily.summary", {
      "Регистрации": registrations,
      "Платежи (всего)": paymentsTotal,
      "Платежи (успешно)": paymentsSucceeded,
      "Ошибки": errors.error,
      "Критические": errors.critical,
      "Предупреждения": errors.warn,
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return handleApiError(error, 500, { route: "GET /api/cron/daily-summary", channel: "cron" });
  }
}
