import { isFullOpenAccessEnabled } from "@/lib/auth/access-flags";

/**
 * Determines whether the authenticated user should receive PRO quota entitlements.
 * Trial window grants temporary PRO access until `trial_ends_at`.
 * Open-access pilot (until 27.12.2026) grants temporary PRO for all signed-in users.
 */
export function hasProEntitlement(profile: {
  subscription_tier: string;
  trial_ends_at: string | null;
}): boolean {
  if (isFullOpenAccessEnabled()) {
    return true;
  }
  if (profile.subscription_tier === "pro") return true;
  if (profile.trial_ends_at) {
    const end = new Date(profile.trial_ends_at).getTime();
    if (!Number.isFinite(end)) return false;
    return end > Date.now();
  }
  return false;
}
