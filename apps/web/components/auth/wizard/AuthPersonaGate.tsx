"use client";

import { useState } from "react";

import type { OnboardingCharacterId } from "@repo/types";

import { AuthGenderPicker } from "@/components/auth/wizard/AuthGenderPicker";
import { AuthWizardLayout } from "@/components/auth/wizard/AuthWizardLayout";
import { Button } from "@/components/ui/button";
import { writeStoredOnboardingCharacter } from "@/lib/auth/auth-wizard-config";

type Props = {
  onContinue: (character: OnboardingCharacterId) => void;
};

export function AuthPersonaGate({ onContinue }: Props) {
  const [character, setCharacter] = useState<OnboardingCharacterId | null>(null);

  return (
    <AuthWizardLayout title="Кто вы?" subtitle="Выбор нужен для персонализации интерфейса. Не медицинские данные.">
      <AuthGenderPicker
        value={character}
        onChange={setCharacter}
        hint="Фото профиля можно загрузить позже в личном кабинете."
      />
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
