"use client";

import Image from "next/image";

import type { OnboardingCharacterId } from "@repo/types";

import { cn } from "@/lib/utils/cn";

const CHARACTER_SRC: Record<OnboardingCharacterId, string> = {
  boy: "/auth/characters/boy.svg",
  girl: "/auth/characters/girl.svg",
};

type Props = {
  character?: OnboardingCharacterId | "duo" | null;
  className?: string;
};

export function AuthCharacterHero({ character = "duo", className }: Props) {
  const showBoy = character === "duo" || character === "boy" || !character;
  const showGirl = character === "duo" || character === "girl" || !character;

  return (
    <div
      className={cn(
        "relative flex h-[min(42vh,320px)] items-end justify-center overflow-hidden bg-gradient-to-b from-sky-100/80 to-[var(--clinical-canvas)] px-6 pt-8 dark:from-slate-800/60",
        className,
      )}
    >
      <div className="pointer-events-none flex items-end justify-center gap-1 sm:gap-4">
        {showBoy ? (
          <Image
            src={CHARACTER_SRC.boy}
            alt=""
            width={140}
            height={182}
            className="h-[min(36vh,240px)] w-auto drop-shadow-md"
            priority
          />
        ) : null}
        {showGirl ? (
          <Image
            src={CHARACTER_SRC.girl}
            alt=""
            width={140}
            height={182}
            className="h-[min(36vh,240px)] w-auto drop-shadow-md"
            priority
          />
        ) : null}
      </div>
    </div>
  );
}
