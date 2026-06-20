"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import {
  FetalSpineSectionContent,
  getSectionIcon,
  isConclusionSection,
} from "@/components/education/fetal-spine/FetalSpineSectionContent";
import { cn } from "@/lib/utils/cn";

type Item = { title: string; content: string | string[]; defaultOpen?: boolean };

export function FetalSpineSectionAccordion({ items }: { items: Item[] }) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <AccordionRow key={item.title} item={item} defaultOpen={item.defaultOpen ?? i === 0} />
      ))}
    </div>
  );
}

function AccordionRow({ item, defaultOpen }: { item: Item; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = getSectionIcon(item.title);
  const isConclusion = isConclusionSection(item.title);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border",
        isConclusion
          ? "border-[var(--clinical-primary)]/30 bg-[var(--clinical-primary-muted)]/50"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)]",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--clinical-muted)]/50 sm:px-5"
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            isConclusion
              ? "bg-[var(--clinical-primary)] text-white"
              : "bg-[var(--clinical-muted)] text-[var(--clinical-primary-deep)]",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-sm font-bold text-[var(--clinical-foreground)]">{item.title}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-[var(--clinical-primary)] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          className={cn(
            "border-t px-4 py-4 text-sm text-[var(--clinical-foreground-muted)] sm:px-5",
            isConclusion && "border-[var(--clinical-primary)]/20 font-medium text-[var(--clinical-foreground)]",
          )}
        >
          <FetalSpineSectionContent content={item.content} />
        </div>
      ) : null}
    </div>
  );
}
