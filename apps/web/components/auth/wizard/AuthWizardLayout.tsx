"use client";

import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/utils/cn";

type Props = {
  children: ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
};

export function AuthWizardLayout({ children, title, subtitle, className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col justify-center px-4 py-8 sm:max-w-md",
        className,
      )}
    >
      <div className="flex flex-col rounded-[28px] border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-6 pb-8 pt-7 shadow-xl">
        <BrandMark className="mx-auto mb-3 h-16 w-16 rounded-2xl" />
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
        <div className="mt-6 flex flex-col">{children}</div>
      </div>
    </div>
  );
}
