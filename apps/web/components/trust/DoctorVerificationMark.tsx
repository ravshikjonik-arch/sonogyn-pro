"use client";

import { BadgeCheck, HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils/cn";

type Props = {
  isVerified: boolean;
  className?: string;
  /** Рядом с аватаром в чате — чуть крупнее */
  size?: "sm" | "md";
};

export function DoctorVerificationMark({ isVerified, className, size = "sm" }: Props) {
  const dim = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";

  if (isVerified) {
    return (
      <span
        className={cn("inline-flex shrink-0 text-emerald-600 dark:text-emerald-400", className)}
        title="Статус врача подтверждён"
        aria-label="Подтверждённый врач"
      >
        <BadgeCheck className={dim} aria-hidden />
      </span>
    );
  }

  return (
    <span
      className={cn("inline-flex shrink-0 text-amber-600 dark:text-amber-400", className)}
      title="Статус не подтверждён — пройдите верификацию в профиле"
      aria-label="Статус не подтверждён"
    >
      <HelpCircle className={dim} aria-hidden />
    </span>
  );
}
