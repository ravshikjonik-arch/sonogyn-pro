/**
 * Determines whether the authenticated user should receive PRO quota entitlements.
 * Trial window grants temporary PRO access until `trial_ends_at`.
 */
export function hasProEntitlement(profile: {
  subscription_tier: string;
  trial_ends_at: string | null;
}): boolean {
  if (profile.subscription_tier === "pro") return true;
  if (profile.trial_ends_at) {
    const end = new Date(profile.trial_ends_at).getTime();
    if (!Number.isFinite(end)) return false;
    return end > Date.now();
  }
  return false;
}
