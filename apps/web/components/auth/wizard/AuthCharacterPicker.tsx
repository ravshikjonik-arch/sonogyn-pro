"use client";

import Image from "next/image";

import type { OnboardingCharacterId } from "@repo/types";

import { cn } from "@/lib/utils/cn";

const CHARACTER_SRC: Record<OnboardingCharacterId, string> = {
  boy: "/auth/characters/boy.svg",
  girl: "/auth/characters/girl.svg",
};

const OPTIONS: { id: OnboardingCharacterId; label: string; hint: string }[] = [
  { id: "boy", label: "Мальчик", hint: "Синий стиль" },
  { id: "girl", label: "Девочка", hint: "Фиолетовый стиль" },
];

type Props = {
  value: OnboardingCharacterId | null;
  onChange: (id: OnboardingCharacterId) => void;
};

export function AuthCharacterPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">
        Персонаж на экране входа — не медицинские данные. Можно сменить позже в профиле.
      </p>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Выбор персонажа на экране входа">
        {OPTIONS.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              className={cn(
                "overflow-hidden rounded-2xl border-2 bg-[var(--clinical-bg)] p-2 text-left transition-[border-color,box-shadow] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
                selected
                  ? "border-[var(--clinical-primary)] shadow-[0_0_0_1px_var(--clinical-primary)]"
                  : "border-[var(--clinical-border)] hover:border-[var(--clinical-primary-deep)]",
              )}
            >
              <div
                className={cn(
                  "pointer-events-none flex h-28 items-end justify-center overflow-hidden rounded-xl bg-gradient-to-b to-transparent",
                  opt.id === "boy" ? "from-sky-100 dark:from-slate-800/50" : "from-violet-100 dark:from-indigo-950/40",
                )}
                aria-hidden
              >
                <Image
                  src={CHARACTER_SRC[opt.id]}
                  alt=""
                  width={80}
                  height={104}
                  className="h-24 w-auto"
                />
              </div>
              <p className="mt-2 text-sm font-bold text-[var(--clinical-foreground)]">{opt.label}</p>
              <p className="text-[10px] text-[var(--clinical-foreground-muted)]">{opt.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
