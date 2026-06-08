import { NextResponse } from "next/server";

import { RestorePurchasesBodySchema } from "@repo/types";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { syncStripeSubscriptionToSupabase } from "@/lib/stripe/sync-subscription";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/**
 * Mobile / multi-device restore — hydrates Supabase from Stripe as source of truth for the authenticated user.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = {};
  }

  const parsed = RestorePurchasesBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const rl = consumeRateLimit(`stripe-restore:${auth.userId}`, 20, 300_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  const admin = createServiceRoleClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", auth.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customerId = profile?.stripe_customer_id as string | null | undefined;
  if (!customerId) {
    return NextResponse.json({ error: "No Stripe customer linked" }, { status: 400 });
  }

  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });

  let primary = subs.data[0];
  for (const s of subs.data) {
    if (s.status === "active" || s.status === "trialing") {
      primary = s;
      break;
    }
  }

  if (!primary) {
    return NextResponse.json({ restored: false, message: "No subscriptions found for customer" });
  }

  await syncStripeSubscriptionToSupabase(admin, auth.userId, primary);

  return NextResponse.json({
    restored: true,
    platform: parsed.data.platform,
    subscriptionId: primary.id,
    status: primary.status,
  });
}
