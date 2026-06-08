import Stripe from "stripe";

/**
 * Lazily constructed Stripe SDK instance for server routes only.
 */
let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}
