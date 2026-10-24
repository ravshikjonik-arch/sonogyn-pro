"use client";

import { useState } from "react";

import type { OnboardingCharacterId } from "@repo/types";

import { AuthCharacterPicker } from "@/components/auth/wizard/AuthCharacterPicker";
import { AuthWizardLayout } from "@/components/auth/wizard/AuthWizardLayout";
import { Button } from "@/components/ui/button";
import { writeStoredOnboardingCharacter } from "@/lib/auth/auth-wizard-config";

type Props = {
  onContinue: (character: OnboardingCharacterId) => void;
};

export function AuthPersonaGate({ onContinue }: Props) {
  const [character, setCharacter] = useState<OnboardingCharacterId | null>(null);

  return (
    <AuthWizardLayout
      title="SonoGyn Pro"
      subtitle="Клинический помощник врача УЗД и акушера-гинеколога"
      character="duo"
    >
      <AuthCharacterPicker value={character} onChange={setCharacter} />
      <Button
        type="button"
        className="mt-6 w-full"
        disabled={!character}
        onClick={() => {
          if (!character) return;
          writeStoredOnboardingCharacter(character);
          onContinue(character);
        }}
      >
        Продолжить
      </Button>
    </AuthWizardLayout>
  );
}
