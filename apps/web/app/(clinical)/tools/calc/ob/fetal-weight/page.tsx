import { FetalWeightCalculator } from "@/components/calculators/obstetric/FetalWeightCalculator";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/ob/fetal-weight");

const content = getCalculatorLandingContent("/tools/calc/ob/fetal-weight")!;

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function FetalWeightPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  return (
    <CalculatorLandingShell content={content}>
      <FetalWeightCalculator initialTab={tab} />
    </CalculatorLandingShell>
  );
}
