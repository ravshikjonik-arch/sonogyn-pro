import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { getSectionIcon, isConclusionSection } from "@/lib/section-icons";
import { cn } from "@/lib/cn";

type AccordionItemProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
};

export function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = getSectionIcon(title);
  const isConclusion = isConclusionSection(title);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border transition-shadow",
        isConclusion
          ? "border-medical-teal/40 bg-gradient-to-br from-medical-teal-soft to-white shadow-sm"
          : "border-medical-border bg-white",
        open && !isConclusion && "shadow-sm",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors sm:px-5",
          isConclusion ? "hover:bg-medical-teal/10" : "hover:bg-slate-50",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            isConclusion ? "bg-medical-teal text-medical-navy" : "bg-medical-navy/8 text-medical-navy",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className={cn("flex-1 text-sm font-bold", isConclusion ? "text-medical-navy" : "text-slate-800")}>
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-medical-teal transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          className={cn(
            "border-t px-4 py-4 text-sm leading-relaxed sm:px-5",
            isConclusion
              ? "border-medical-teal/20 text-medical-navy font-medium"
              : "border-medical-border text-slate-700",
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

type AccordionProps = {
  items: Array<{ title: string; content: React.ReactNode; defaultOpen?: boolean }>;
};

export function Accordion({ items }: AccordionProps) {
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <AccordionItem key={item.title} title={item.title} defaultOpen={item.defaultOpen ?? i === 0}>
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
}
