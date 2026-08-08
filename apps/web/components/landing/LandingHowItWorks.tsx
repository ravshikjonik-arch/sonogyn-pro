import Link from "next/link";

import { Button } from "@/components/ui/button";

import { LANDING_HOW_IT_WORKS } from "./data";

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">
            Как это работает
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--clinical-foreground)] sm:text-3xl">
            Три шага до первого кейса
          </h2>
        </div>
        <Button variant="outline" size="sm" className="self-start font-semibold sm:self-auto" asChild>
          <Link href="/app">Открыть кабинет</Link>
        </Button>
      </div>

      <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
        {LANDING_HOW_IT_WORKS.map((item) => (
          <li key={item.step} className="relative">
            <span className="text-5xl font-black tabular-nums leading-none text-[var(--clinical-primary-muted)]">
              {item.step}
            </span>
            <h3 className="mt-4 text-lg font-bold text-[var(--clinical-foreground)]">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
