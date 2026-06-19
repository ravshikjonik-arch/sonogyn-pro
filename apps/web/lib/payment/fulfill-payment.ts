import type { SupabaseClient } from "@supabase/supabase-js";

import { TelegramService } from "@/services/telegram";

/** Обновляет заказ и активирует PRO после payment.succeeded (идемпотентно). */
export async function fulfillSucceededPayment(
  admin: SupabaseClient,
  params: {
    paymentRowId: string;
    userId: string;
    yookassaId: string;
    amountRub: number;
    description?: string | null;
    previousStatus: string;
  },
): Promise<void> {
  const now = new Date().toISOString();

  if (params.previousStatus === "succeeded") {
    return;
  }

  const { error: payErr } = await admin
    .from("payments")
    .update({ status: "succeeded", updated_at: now })
    .eq("id", params.paymentRowId);

  if (payErr) {
    console.error("[payment/fulfill] payments update", payErr.message);
    throw payErr;
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      subscription_tier: "pro",
      subscription_expires_at: expires.toISOString(),
      updated_at: now,
    })
    .eq("id", params.userId);

  if (profileErr) {
    console.error("[payment/fulfill] profiles update", profileErr.message);
    throw profileErr;
  }

  await TelegramService.notifyAdmins("payment.succeeded", {
    userId: params.userId,
    yookassaId: params.yookassaId,
    amountRub: params.amountRub,
    description: params.description ?? undefined,
  });
}
