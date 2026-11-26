import { TiradsProFlow } from "@/components/calculators/tirads/TiradsProFlow";
import { CalculatorSourceBadge } from "@/components/calculators/CalculatorSourceBadge";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/ti-rads");

const content = getCalculatorLandingContent("/tools/calc/rads/ti-rads")!;

/** Canonical RADS path — same family as O-RADS / BI-RADS / LN-RADS. */
export default function TiradsRadsPage() {
  return (
    <CalculatorLandingShell content={content}>
      <TiradsProFlow />
      <CalculatorSourceBadge
        title="ACR TI-RADS (2017)"
        reference="Tessler et al. · JACR 14:582–595 · точки, структура, эхогенность, FNA-пороги"
        organization="ACR"
        verified="Сверено 25.11.2026 · юнит-тесты ✓"
      />
    </CalculatorLandingShell>
  );
}
