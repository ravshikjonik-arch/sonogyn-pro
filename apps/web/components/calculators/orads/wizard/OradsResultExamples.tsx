"use client";

import Link from "next/link";
import { getOradsResultExamples, type OradsTreePathStep, type OradsTreeResult } from "@repo/orads-us";

import { OradsNosologyPreview } from "@/components/calculators/orads/OradsNosologyPreview";

type Props = {
  path: readonly OradsTreePathStep[];
  result: OradsTreeResult;
};

/** After the wizard: practice echograms of what the computed result typically looks like. */
export function OradsResultExamples({ path, result }: Props) {
  const examples = getOradsResultExamples(path, result);
  if (!examples.length) return null;

  return (
    <section className="space-y-3" aria-labelledby="orads-result-examples" data-e2e-orads-result-examples>
      <div>
        <h3 id="orads-result-examples" className="text-base font-semibold text-[var(--clinical-foreground)]">
          Пример похожего случая
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Категория посчитана по вашим ответам. Ниже обезличенные эхограммы из практики для сравнения с вашей картиной.
          Не диагноз — интерпретация специалиста.
        </p>
      </div>
      {examples.map((entry) => (
        <OradsNosologyPreview key={entry.id} entry={entry} compact />
      ))}
      <Link
        href="/tools/refs/orads-echograms"
        className="inline-block text-xs font-semibold text-[var(--clinical-primary-deep)] hover:underline"
      >
        Все эхограммы O-RADS →
      </Link>
    </section>
  );
}
