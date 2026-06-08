import { NextResponse } from "next/server";

import { CreateCheckoutBodySchema } from "@repo/types";

import { logProductAnalyticsWeb } from "@/lib/analytics/firebase-web";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/**
 * Creates an idempotent Stripe Checkout Session for PRO subscription with a 7-day trial.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateCheckoutBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const rl = consumeRateLimit(`stripe-checkout:${auth.userId}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const successUrl = parsed.data.successUrl ?? `${appUrl}/profile?checkout=success`;
  const cancelUrl = parsed.data.cancelUrl ?? `${appUrl}/paywall?checkout=cancel`;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: "User email required for billing" }, { status: 400 });
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", auth.userId)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  const stripe = getStripe();
  const admin = createServiceRoleClient();

  let customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: auth.userId },
    });
    customerId = customer.id;
    const { error: custErr } = await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("id", auth.userId);
    if (custErr) {
      return NextResponse.json({ error: custErr.message }, { status: 500 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: auth.userId,
    success_url: successUrl,
    cancel_url: cancelUrl,
    line_items: [{ price: parsed.data.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 7,
      metadata: { supabase_user_id: auth.userId },
    },
    metadata: { supabase_user_id: auth.userId },
  });

  await logProductAnalyticsWeb("subscription_started", {
    plan: parsed.data.priceId,
    trial: true,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
