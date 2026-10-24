"use client";

import Image from "next/image";

import type { OnboardingCharacterId } from "@repo/types";

import { AUTH_DUO_BANNER_SRC, CHARACTER_ASSETS } from "@/lib/auth/character-assets";
import { cn } from "@/lib/utils/cn";

type Props = {
  character?: OnboardingCharacterId | "duo" | null;
  className?: string;
};

export function AuthCharacterHero({ character = "duo", className }: Props) {
  if (character === "duo" || !character) {
    return (
      <div
        className={cn(
          "relative h-[min(44vh,360px)] w-full overflow-hidden bg-[#050a14]",
          className,
        )}
      >
        <Image
          src={AUTH_DUO_BANNER_SRC}
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 512px) 100vw, 512px"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--clinical-card)]" />
      </div>
    );
  }

  const asset = CHARACTER_ASSETS[character];

  return (
    <div
      className={cn(
        "relative h-[min(44vh,360px)] w-full overflow-hidden bg-[#050a14]",
        className,
      )}
    >
      <Image
        src={asset.hero}
        alt=""
        fill
        className="object-cover object-top"
        priority
        sizes="(max-width: 512px) 100vw, 512px"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--clinical-card)]" />
    </div>
  );
}
