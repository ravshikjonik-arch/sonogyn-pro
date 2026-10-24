import type { OnboardingCharacterId } from "@repo/types";

import { writeStoredOnboardingCharacter } from "@/lib/auth/auth-wizard-config";

export async function saveOnboardingCharacter(
  character: OnboardingCharacterId,
  extras?: { specialization?: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  writeStoredOnboardingCharacter(character);

  const res = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({
      ...(extras?.specialization ? { specialization: extras.specialization } : {}),
      clinical_preferences: { onboardingCharacter: character },
    }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: payload?.error ?? "Не удалось сохранить персонажа." };
  }

  return { ok: true };
}
