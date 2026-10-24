"use client";

import { useState } from "react";
import { toast } from "sonner";

import type { OnboardingCharacterId } from "@repo/types";
import { parseClinicalPreferences } from "@repo/types";

import { AuthCharacterPicker } from "@/components/auth/wizard/AuthCharacterPicker";
import { Button } from "@/components/ui/button";
import { readStoredOnboardingCharacter } from "@/lib/auth/auth-wizard-config";
import { saveOnboardingCharacter } from "@/lib/auth/save-onboarding-character";

type Props = {
  initialPreferences: unknown;
};

export function OnboardingCharacterProfileSection({ initialPreferences }: Props) {
  const prefs = parseClinicalPreferences(initialPreferences);
  const [character, setCharacter] = useState<OnboardingCharacterId | null>(
    prefs.onboardingCharacter ?? readStoredOnboardingCharacter(),
  );
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (!character) {
      toast.error("Выберите персонажа.");
      return;
    }
    setSaving(true);
    try {
      const result = await saveOnboardingCharacter(character);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Персонаж на экране входа обновлён.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-6">
      <h2 className="text-lg font-black text-[var(--clinical-foreground)]">Персонаж на экране входа</h2>
      <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
        Только оформление login/register. Не относится к клиническим данным.
      </p>
      <div className="mt-4">
        <AuthCharacterPicker value={character} onChange={setCharacter} />
      </div>
      <Button type="button" className="mt-4" disabled={saving || !character} onClick={() => void onSave()}>
        Сохранить персонажа
      </Button>
    </section>
  );
}
