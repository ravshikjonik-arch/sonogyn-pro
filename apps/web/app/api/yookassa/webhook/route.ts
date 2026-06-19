import { NextResponse } from "next/server";

import { fetchYooKassaPayment } from "@/lib/yookassa/client";
import { isYooKassaConfigured } from "@/lib/yookassa/config";
import { activateProFromYooKassaPayment } from "@/lib/yookassa/sync-subscription";
import type { YooKassaWebhookEvent } from "@/lib/yookassa/types";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/** POST /api/yookassa/webhook — уведомления от ЮKassa. */
export async function POST(req: Request) {
  if (!isYooKassaConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const event = (await req.json()) as YooKassaWebhookEvent;
    const yookassaId = event.object?.id;
    if (!yookassaId) {
      return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
    }

    const remote = await fetchYooKassaPayment(yookassaId);
    const admin = createServiceRoleClient();

    const { data: row, error: findErr } = await admin
      .from("yookassa_payments")
      .select("id, user_id, status, amount_rub")
      .eq("yookassa_id", yookassaId)
      .maybeSingle();

    if (findErr) {
      console.error("[yookassa/webhook] lookup", findErr.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ ok: true, note: "unknown_payment" });
    }

    const { error: updateErr } = await admin
      .from("yookassa_payments")
      .update({
        status: remote.status,
        metadata: remote.metadata ?? {},
        updated_at: new Date().toISOString(),
      })
      .eq("yookassa_id", yookassaId);

    if (updateErr) {
      console.error("[yookassa/webhook] update", updateErr.message);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }

    if (remote.status === "succeeded" && row.status !== "succeeded") {
      await activateProFromYooKassaPayment(
        admin,
        row.user_id as string,
        yookassaId,
        Number(row.amount_rub),
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[yookassa/webhook]", err);
    return NextResponse.json({ error: "webhook_failed" }, { status: 500 });
  }
}
