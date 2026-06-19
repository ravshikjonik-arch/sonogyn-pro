"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";

import { LANDING_FAQ } from "./data";

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24">
      <div className="mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">FAQ</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white sm:text-3xl">Частые вопросы</h2>
      </div>
      <div className="mx-auto max-w-3xl divide-y divide-[var(--clinical-border)] rounded-2xl border border-[var(--clinical-border)] bg-white/80 dark:bg-[var(--clinical-card)]">
        {LANDING_FAQ.map((item, index) => {
          const isOpen = openIndex === index;
          const panelId = `landing-faq-panel-${index}`;
          const buttonId = `landing-faq-button-${index}`;

          return (
            <div key={item.question}>
              <button
                id={buttonId}
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50/80 dark:hover:bg-white/5"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
              >
                <span className="font-semibold text-slate-900 dark:text-white">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 shrink-0 text-[var(--clinical-foreground-muted)] transition-transform",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                hidden={!isOpen}
                className={cn("px-5 pb-4 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]", !isOpen && "hidden")}
              >
                {item.answer}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
