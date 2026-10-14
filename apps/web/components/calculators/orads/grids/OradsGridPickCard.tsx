"use client";

import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  hint?: string;
  imageSrc?: string;
  imageAlt?: string;
  selected?: boolean;
  onClick: () => void;
  badge?: string;
  children?: ReactNode;
};

/** Карточка выбора в сетке O-RADS: подпись всегда читается, фото не перекрывает кнопку. */
export function OradsGridPickCard({
  title,
  hint,
  imageSrc,
  imageAlt,
  selected = false,
  onClick,
  badge,
  children,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border-2 text-left transition",
        "bg-[var(--clinical-card)] text-[var(--clinical-foreground)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
        selected
          ? "border-[var(--clinical-primary)] ring-2 ring-[var(--clinical-primary-muted)]"
          : "border-[var(--clinical-border)] hover:border-[var(--clinical-primary)]",
      )}
    >
      {imageSrc ? (
        <div className="relative h-24 w-full shrink-0 bg-black/85 sm:h-28">
          <Image
            src={imageSrc}
            alt={imageAlt ?? title}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 50vw, 220px"
          />
        </div>
      ) : null}
      <span className="flex min-h-[4.5rem] flex-1 flex-col gap-1 bg-[var(--clinical-card)] px-3 py-2.5">
        <span className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold leading-snug">{title}</span>
          {badge ? (
            <span className="shrink-0 rounded-md border border-[var(--clinical-border)] bg-[var(--clinical-muted)] px-1.5 py-0.5 text-[10px] font-bold">
              {badge}
            </span>
          ) : null}
        </span>
        {hint ? <span className="text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">{hint}</span> : null}
        {children}
      </span>
    </button>
  );
}
