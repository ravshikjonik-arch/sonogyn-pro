"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { MYOMA_DISCLAIMER } from "@repo/myoma-education";

const LINKS = [
  { href: "/tools/refs/myoma-education", label: "Модули" },
  { href: "/tools/refs/myoma-education/atlas", label: "Атлас" },
  { href: "/tools/refs/myoma-education/quiz", label: "Тест" },
  { href: "/tools/refs/myoma-education/calculators", label: "Калькуляторы" },
] as const;

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

export function MyomaChrome({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto min-h-[100dvh] w-full min-w-0 max-w-3xl space-y-6 overflow-x-hidden px-4 py-6 pb-28">
      <header className="space-y-3">
        <Link href="/tools/gynecology" className={`text-sm font-medium text-[var(--clinical-foreground-muted)] ${focus}`}>
          ← Гинекология
        </Link>
        {kicker ? <p className="text-sm font-medium text-[var(--clinical-foreground-muted)]">{kicker}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)] sm:text-3xl">{title}</h1>
        <nav aria-label="Раздел обучения по миоме" className="flex flex-wrap gap-2">
          {LINKS.map((link) => {
            const current = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium ${focus} ${
                  current
                    ? "border-[var(--clinical-primary)] bg-[var(--clinical-muted)] text-[var(--clinical-foreground)]"
                    : "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
      <p className="max-w-[72ch] text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{MYOMA_DISCLAIMER}</p>
    </div>
  );
}
