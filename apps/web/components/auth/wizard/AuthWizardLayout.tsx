"use client";

import type { ReactNode } from "react";

import type { OnboardingCharacterId } from "@repo/types";

import { AuthCharacterHero } from "@/components/auth/wizard/AuthCharacterHero";
import { cn } from "@/lib/utils/cn";

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  character?: OnboardingCharacterId | "duo" | null;
  className?: string;
};

export function AuthWizardLayout({ children, title, subtitle, character = "duo", className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col bg-[var(--clinical-canvas)] sm:max-w-md",
        className,
      )}
    >
      <AuthCharacterHero character={character} />
      <div className="relative z-10 -mt-6 flex flex-1 flex-col rounded-t-[28px] border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-6 pb-8 pt-7 shadow-xl">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--clinical-primary-deep)]">
          SonoGyn Pro
        </p>
        <h1 className="mt-2 text-center text-2xl font-black tracking-tight text-[var(--clinical-foreground)]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-center text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-6 flex flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
