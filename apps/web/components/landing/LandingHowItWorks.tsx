import Link from "next/link";

import { Button } from "@/components/ui/button";

import { LANDING_HOW_IT_WORKS } from "./data";

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 sonogyn-glass-card rounded-3xl p-8 sm:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
            Как это работает
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950 dark:text-white">3 шага до первого кейса</h2>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/register">Создать аккаунт</Link>
        </Button>
      </div>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {LANDING_HOW_IT_WORKS.map((item) => (
          <li key={item.step} className="sonogyn-step-card">
            <span className="sonogyn-step-num">{item.step}</span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{item.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
