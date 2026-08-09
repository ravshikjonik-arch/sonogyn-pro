const TRUE = new Set(["true", "1", "yes"]);
const FALSE = new Set(["false", "0", "no"]);

/**
 * Soft-open cabinet: guests use tools without login.
 * Social IdP (Yandex) paused until OAuth is stable — set NEXT_PUBLIC_AUTH_SOCIAL_ENABLED=true to show again.
 */
export function isAuthSocialEnabled(): boolean {
  const raw = (process.env.NEXT_PUBLIC_AUTH_SOCIAL_ENABLED ?? "").trim().toLowerCase();
  if (FALSE.has(raw)) return false;
  if (TRUE.has(raw)) return true;
  // Default OFF while Yandex custom OAuth is being stabilized.
  return false;
}

export function isAuthSocialEnabledClient(): boolean {
  return isAuthSocialEnabled();
}
