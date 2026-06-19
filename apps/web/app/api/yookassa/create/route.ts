import { NextResponse } from "next/server";
import { z } from "zod";

import { mapExternalApiError } from "@/lib/http/external-api-errors";
import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createYooKassaPayment } from "@/lib/yookassa/client";
import { isYooKassaConfigured, readYooKassaProPriceRub } from "@/lib/yookassa/config";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  amountRub: z.number().min(1).max(1_000_000).optional(),
  description: z.string().min(3).max(200).optional(),
});

/** POST /api/yookassa/create — создание платежа PRO (РФ). */
export async function POST(req: Request) {
  if (!isYooKassaConfigured()) {
    return NextResponse.json({ error: "yookassa_not_configured" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json().catch(() => ({}));
  } catch {
    json = {};
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(
    `yookassa-create:${auth.userId}`,
    RL.yookassaCreate.limit,
    RL.yookassaCreate.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const appOrigin = resolveAppOrigin(req);
  const amountRub = parsed.data.amountRub ?? readYooKassaProPriceRub();
  const description = parsed.data.description ?? "SonoGyn Pro — подписка на 30 дней";

  try {
    const payment = await createYooKassaPayment({
      userId: auth.userId,
      amountRub,
      description,
      returnUrl: `${appOrigin}/profile?checkout=yookassa_return`,
    });

    const admin = createServiceRoleClient();
    const { error: insertErr } = await admin.from("yookassa_payments").insert({
      user_id: auth.userId,
      yookassa_id: payment.id,
      amount_rub: amountRub,
      status: payment.status,
      description,
      confirmation_url: payment.confirmation?.confirmation_url ?? null,
      metadata: payment.metadata ?? {},
    });

    if (insertErr) {
      console.error("[yookassa/create] db insert", insertErr.message);
      return NextResponse.json({ error: "payment_record_failed" }, { status: 500 });
    }

    return NextResponse.json({
      yookassaId: payment.id,
      confirmationUrl: payment.confirmation?.confirmation_url,
      amountRub,
    });
  } catch (err) {
    console.error("[yookassa/create]", err);
    return NextResponse.json(
      { error: mapExternalApiError("yookassa", err) },
      { status: 502 },
    );
  }
}
