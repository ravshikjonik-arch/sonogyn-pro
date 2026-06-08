import { NextResponse } from "next/server";

import Stripe from "stripe";

import { findUserIdByStripeCustomer, syncStripeSubscriptionToSupabase } from "@/lib/stripe/sync-subscription";
import { getStripe } from "@/lib/stripe/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

/**
 * Stripe webhook entrypoint — verifies signatures and syncs subscription rows + profile tier.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid payload";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const admin = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id ?? session.client_reference_id ?? undefined;
        const customerId =
          typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
        const subRef = session.subscription;
        const subscriptionId =
          typeof subRef === "string" ? subRef : typeof subRef === "object" && subRef && "id" in subRef ? subRef.id : null;

        if (customerId && userId) {
          await admin
            .from("profiles")
            .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
            .eq("id", userId);
        }

        if (subscriptionId && userId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          await syncStripeSubscriptionToSupabase(admin, userId, sub);
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const metaUser = sub.metadata?.supabase_user_id;
        const customerId =
          typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? undefined;
        const userId =
          metaUser ??
          (customerId ? await findUserIdByStripeCustomer(admin, customerId) : null);

        if (userId) {
          await syncStripeSubscriptionToSupabase(admin, userId, sub);
        } else {
          console.warn("[stripe-webhook] Unable to resolve user for subscription", sub.id);
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe-webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
