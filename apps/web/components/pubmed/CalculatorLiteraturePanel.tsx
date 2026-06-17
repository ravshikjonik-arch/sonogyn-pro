"use client";

import { PubmedLiteraturePanel } from "@/components/pubmed/PubmedLiteraturePanel";
import {
  getCalculatorLiterature,
  pubmedSearchUrlForCalculator,
  type CalculatorLiteratureSlug,
} from "@/lib/pubmed/calculator-literature";

type Props = {
  slug: CalculatorLiteratureSlug;
  compact?: boolean;
  className?: string;
};

export function CalculatorLiteraturePanel({ slug, compact, className }: Props) {
  const cfg = getCalculatorLiterature(slug);

  return (
    <PubmedLiteraturePanel
      title={cfg.title}
      description={cfg.description}
      pubmedHref={pubmedSearchUrlForCalculator(slug)}
      items={cfg.literature}
      extraLinks={[{ href: cfg.evidenceHref, label: cfg.evidenceLabel }]}
      compact={compact}
      className={className}
    />
  );
}
