import type { Metadata } from "next";

import { ElastographyCalculator } from "@/components/calculators/elastography/ElastographyCalculator";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";

export const metadata: Metadata = {
  title: "Эластография — калькулятор",
  description: "Strain / SWE: шейка, миометрий, яичники, молочная железа.",
};

export default function ElastographyCalculatorPage() {
  return (
    <>
      <ElastographyCalculator />
      <div className="mx-auto max-w-4xl px-4 pb-10">
        <CalculatorLiteraturePanel slug="elastography" />
      </div>
    </>
  );
}
