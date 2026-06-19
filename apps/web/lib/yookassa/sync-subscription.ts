import type { SupabaseClient } from "@supabase/supabase-js";

/** Активирует PRO на 30 дней после успешной оплаты ЮKassa. */
export async function activateProFromYooKassaPayment(
  admin: SupabaseClient,
  userId: string,
  yookassaId: string,
  amountRub: number,
): Promise<void> {
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);

  const { error: payErr } = await admin
    .from("yookassa_payments")
    .update({
      status: "succeeded",
      updated_at: now.toISOString(),
    })
    .eq("yookassa_id", yookassaId);

  if (payErr) {
    console.error("[yookassa-sync] payment update failed", payErr.message);
    throw payErr;
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      subscription_tier: "pro",
      subscription_expires_at: expires.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq("id", userId);

  if (profileErr) {
    console.error("[yookassa-sync] profiles update failed", profileErr.message);
    throw profileErr;
  }

  console.info("[yookassa-sync] PRO activated", { userId, yookassaId, amountRub });
}
