import { getUpstashRestCredentials } from "@/lib/security/upstash-env";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * SECURITY: claim Stripe event id once — duplicate deliveries must not re-run side effects.
 * Prefers Upstash SET NX; falls back to `stripe_webhook_events` unique insert when table exists.
 */
export async function claimStripeWebhookEvent(
  admin: SupabaseClient,
  eventId: string,
): Promise<"claimed" | "duplicate"> {
  const id = eventId.trim();
  if (!id) return "duplicate";

  const redisClaim = await claimViaUpstash(id);
  if (redisClaim === "claimed" || redisClaim === "duplicate") return redisClaim;

  const { error } = await admin.from("stripe_webhook_events").insert({
    event_id: id,
    received_at: new Date().toISOString(),
  });

  if (!error) return "claimed";
  // unique_violation → already processed
  if (error.code === "23505") return "duplicate";
  // Table missing / other: fail open for sync (upsert is mostly idempotent) but log.
  console.warn("[stripe-webhook] idempotency insert failed", error.code, error.message);
  return "claimed";
}

async function claimViaUpstash(eventId: string): Promise<"claimed" | "duplicate" | "unavailable"> {
  const creds = getUpstashRestCredentials();
  if (!creds) return "unavailable";

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    const redis = new Redis({ url: creds.url, token: creds.token });
    const key = `sonogyn:stripe:evt:${eventId}`;
    // SET NX EX 7d
    const ok = await redis.set(key, "1", { nx: true, ex: 60 * 60 * 24 * 7 });
    if (ok === null) return "duplicate";
    return "claimed";
  } catch {
    return "unavailable";
  }
}
