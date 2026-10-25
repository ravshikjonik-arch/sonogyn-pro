"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function OradsReferoSection({ title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-semibold text-[var(--clinical-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-[var(--clinical-foreground-muted)] transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="space-y-3 border-t border-[var(--clinical-border)] px-4 pb-4 pt-3">{children}</div>
      ) : null}
    </div>
  );
}
