const TRUE = new Set(["true", "1", "yes"]);
const FALSE = new Set(["false", "0", "no"]);

/**
 * Soft-open cabinet: guests use tools without login.
 * OAuth is still visible: it is the lowest-friction path for saving cases and PRO conversion.
 * Set NEXT_PUBLIC_AUTH_SOCIAL_ENABLED=false only for incident rollback.
 */
export function isAuthSocialEnabled(): boolean {
  const raw = (process.env.NEXT_PUBLIC_AUTH_SOCIAL_ENABLED ?? "").trim().toLowerCase();
  if (FALSE.has(raw)) return false;
  if (TRUE.has(raw)) return true;
  return true;
}

export function isAuthSocialEnabledClient(): boolean {
  return isAuthSocialEnabled();
}
