import Link from "next/link";

import { POPULAR_CALCULATOR_LINKS } from "@/lib/seo/calculator-landing-content";

export function LandingPopularCalculators() {
  return (
    <section
      id="popular-calculators"
      className="space-y-4"
      aria-labelledby="popular-calculators-heading"
    >
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300/80">
          Для врача на приёме
        </p>
        <h2
          id="popular-calculators-heading"
          className="mt-2 text-2xl font-black tracking-tight text-[var(--clinical-foreground)] sm:text-3xl"
        >
          Популярные калькуляторы
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          O-RADS, IOTA, BI-RADS, TI-RADS, эндометрий, EFW, Bishop, VBAC — с методикой и источниками на
          странице инструмента.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {POPULAR_CALCULATOR_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex h-full items-center rounded-2xl border border-violet-400/25 bg-black/35 px-4 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(139,92,246,0.15)] backdrop-blur-md transition hover:border-violet-300/50 hover:bg-black/50"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-sm">
        <Link
          href="/tools/calc"
          className="font-semibold text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline"
        >
          Весь каталог калькуляторов →
        </Link>
      </p>
    </section>
  );
}
