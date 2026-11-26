import { FetalWeightCalculator } from "@/components/calculators/obstetric/FetalWeightCalculator";
import { CalculatorSourceBadge } from "@/components/calculators/CalculatorSourceBadge";
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
      <CalculatorSourceBadge
        title="Hadlock et al. (1985)"
        reference="J Pediatr 107:589–596 · формулы EFW"
        verified="Сверено 25.11.2026 · юнит-тесты ✓"
      />
    </CalculatorLandingShell>
  );
}
