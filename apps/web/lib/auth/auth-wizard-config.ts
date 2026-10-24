import type { OnboardingCharacterId } from "@repo/types";

export const ONBOARDING_CHARACTER_STORAGE_KEY = "sonogyn:onboarding-character:v1";

export function isAuthWizardV2Enabled(): boolean {
  const raw = (process.env.NEXT_PUBLIC_AUTH_WIZARD_V2 ?? "true").trim().toLowerCase();
  return raw !== "false" && raw !== "0" && raw !== "no";
}

export function readStoredOnboardingCharacter(): OnboardingCharacterId | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(ONBOARDING_CHARACTER_STORAGE_KEY);
    if (v === "boy" || v === "girl") return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredOnboardingCharacter(id: OnboardingCharacterId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_CHARACTER_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
