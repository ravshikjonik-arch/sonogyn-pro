import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

/**
 * Projects Stripe subscription lifecycle into `subscriptions` + `profiles` for app RBAC and paywall gating.
 *
 * @param admin — Service-role Supabase client (bypasses RLS for trusted server writes).
 * @param userId — Supabase auth user UUID owning the subscription row.
 * @param subscription — Stripe Subscription object (expanded customer optional).
 */
export async function syncStripeSubscriptionToSupabase(
  admin: SupabaseClient,
  userId: string,
  subscription: Stripe.Subscription,
): Promise<void> {
  const activeStates = new Set(["trialing", "active"]);
  const active = activeStates.has(subscription.status);

  /** Stripe SDK typings vary by API version — coerce Unix epochs safely at runtime. */
  const epochs = subscription as unknown as {
    current_period_start?: number | null;
    current_period_end?: number | null;
  };

  const periodStart =
    typeof epochs.current_period_start === "number"
      ? new Date(epochs.current_period_start * 1000).toISOString()
      : null;
  const periodEnd =
    typeof epochs.current_period_end === "number"
      ? new Date(epochs.current_period_end * 1000).toISOString()
      : null;

  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    console.error("[stripe-sync] subscription missing customer id", subscription.id);
    return;
  }

  const subRow = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    status: subscription.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
  };

  const { error: subErr } = await admin.from("subscriptions").upsert(subRow, {
    onConflict: "stripe_subscription_id",
  });
  if (subErr) {
    console.error("[stripe-sync] subscriptions upsert failed", subErr.message);
    throw subErr;
  }

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      subscription_tier: active ? "pro" : "free",
      subscription_expires_at: active ? periodEnd : null,
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileErr) {
    console.error("[stripe-sync] profiles update failed", profileErr.message);
    throw profileErr;
  }
}

/**
 * Resolves a Supabase user id from a Stripe customer id via `profiles.stripe_customer_id`.
 */
export async function findUserIdByStripeCustomer(
  admin: SupabaseClient,
  customerId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data.id as string;
}
