import Link from "next/link";
import { BookOpen } from "lucide-react";

import { getCalculatorGuidelineSources } from "@/lib/calculators/guideline-sources";

type Props = {
  calculatorId: string;
  className?: string;
};

export function CalculatorSourcesPanel({ calculatorId, className }: Props) {
  const sources = getCalculatorGuidelineSources(calculatorId);
  if (sources.length === 0) return null;

  return (
    <section
      className={`rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 ${className ?? ""}`}
    >
      <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--clinical-foreground)]">
        <BookOpen className="h-4 w-4 text-[var(--clinical-primary)]" aria-hidden />
        Источники
      </h2>
      <ul className="mt-3 space-y-2 text-sm">
        {sources.map((item) => (
          <li key={item.href + item.label}>
            <Link
              href={item.href}
              className="text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline"
              {...(item.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
