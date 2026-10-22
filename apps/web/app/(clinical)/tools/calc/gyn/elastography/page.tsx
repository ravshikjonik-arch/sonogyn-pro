import { ElastographyCalculator } from "@/components/calculators/elastography/ElastographyCalculator";
import { CalculatorLiteraturePanel } from "@/components/pubmed/CalculatorLiteraturePanel";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/gyn/elastography");

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
