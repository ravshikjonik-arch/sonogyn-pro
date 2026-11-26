import { BishopCalculator } from "@/components/calculators/obstetric/BishopCalculator";
import { CalculatorSourceBadge } from "@/components/calculators/CalculatorSourceBadge";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/ob/bishop");

const content = getCalculatorLandingContent("/tools/calc/ob/bishop")!;

export default function BishopPage() {
  return (
    <CalculatorLandingShell content={content}>
      <BishopCalculator />
      <CalculatorSourceBadge
        title="Bishop E.H. (1964)"
        reference="Am J Obstet Gynecol 90:831 · система оценки готовности шейки матки"
        verified="Сверено 25.11.2026 · юнит-тесты ✓"
      />
    </CalculatorLandingShell>
  );
}
