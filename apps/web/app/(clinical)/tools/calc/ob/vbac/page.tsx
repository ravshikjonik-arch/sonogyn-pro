import { VbacCalculator } from "@/components/calculators/obstetric/VbacCalculator";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/ob/vbac");

const content = getCalculatorLandingContent("/tools/calc/ob/vbac")!;

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function VbacPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  return (
    <CalculatorLandingShell content={content}>
      <VbacCalculator initialTab={tab} />
    </CalculatorLandingShell>
  );
}
