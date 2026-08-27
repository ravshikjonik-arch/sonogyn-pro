import { createHash } from "crypto";

import type { DevLoginConfig } from "@/lib/auth/dev-account";
import { isFullOpenAccessEnabled } from "@/lib/auth/dev-account";

export const GUEST_DEMO_EMAIL = "open-access@sonogyn.pro";

function resolveGuestDemoPassword(): string | null {
  const fromEnv = process.env.GUEST_DEMO_PASSWORD?.trim();
  if (fromEnv) return fromEnv;

  const secret = process.env.SONOGYN_AUTH_INTERNAL_SECRET?.trim();
  if (secret) {
    return createHash("sha256").update(`guest-demo:${secret}`).digest("hex").slice(0, 40);
  }

  return null;
}

/** Shared demo doctor for zero-login open access (Supabase session, invisible to the user). */
export function getGuestDemoConfig(): DevLoginConfig | null {
  if (!isFullOpenAccessEnabled()) return null;

  const password = resolveGuestDemoPassword();
  if (!password) return null;

  const email = process.env.GUEST_DEMO_EMAIL?.trim() || GUEST_DEMO_EMAIL;

  return {
    email,
    password,
    full_name: "Открытый доступ",
    specialization: "Акушер-гинеколог / врач УЗД",
    institution: "SonoGyn Pro",
    birth_year: 1988,
  };
}

export function isGuestDemoAutoLoginEnabled(): boolean {
  return isFullOpenAccessEnabled() && Boolean(getGuestDemoConfig());
}

export function isFullOpenAccessEnabledClient(): boolean {
  const raw = (process.env.NEXT_PUBLIC_OPEN_ACCESS_FULL ?? "true").trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
}
