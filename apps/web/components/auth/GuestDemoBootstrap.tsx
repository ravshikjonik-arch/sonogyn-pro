"use client";

/**
 * Open-access cabinet does not need an invisible Supabase session.
 * The previous guest-session call 503'd in production and delayed first paint.
 */
export function GuestDemoBootstrap() {
  return null;
}
