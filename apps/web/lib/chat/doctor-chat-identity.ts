import { GUEST_DEMO_EMAIL } from "@/lib/auth/guest-demo-account";
import { buildFioAbbreviation } from "@/lib/auth/doctor-display";

/** Shared inbox for read-only guest browsing (must never post as a real doctor). */
export const CHAT_GUEST_EMAIL = "chat-guest@sonogyn.pro";

const SHARED_CHAT_EMAILS = new Set(
  [GUEST_DEMO_EMAIL, CHAT_GUEST_EMAIL, "open-access@sonogyn.pro"]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export function isSharedChatEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return SHARED_CHAT_EMAILS.has(email.trim().toLowerCase());
}

/** Stable public handle from auth user id (first 6 hex of UUID). */
export function doctorPublicCode(userId: string): string {
  const hex = userId.replace(/-/g, "").toUpperCase();
  return hex.slice(0, 6) || "000000";
}

export function formatDoctorChatDisplayName(input: {
  userId: string;
  fullName?: string | null;
  email?: string | null;
  specialization?: string | null;
}): string {
  if (isSharedChatEmail(input.email)) {
    return "Гость";
  }

  const fio = input.fullName?.trim();
  if (fio && !/^врач$/i.test(fio)) {
    if (/^гость$/i.test(fio) || /^открытый доступ$/i.test(fio)) return "Гость";
    return buildFioAbbreviation(fio) ?? fio;
  }

  const spec = input.specialization?.trim();
  if (spec) {
    return `${spec} · №${doctorPublicCode(input.userId)}`;
  }

  const local = input.email?.includes("@") ? input.email.split("@")[0]?.trim() : "";
  if (local && local.length >= 2 && !local.startsWith("open-access") && !local.startsWith("chat-guest")) {
    return `${local} · №${doctorPublicCode(input.userId)}`;
  }

  return `Врач №${doctorPublicCode(input.userId)}`;
}
