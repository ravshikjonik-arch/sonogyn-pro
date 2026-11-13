import { OradsProFlow } from "@/components/calculators/orads/OradsProFlow";
import { ModuleProgressWidget } from "@/components/achievements/ModuleProgressWidget";
import { CalculatorLandingShell } from "@/components/seo/CalculatorLandingShell";
import { getCalculatorLandingContent } from "@/lib/seo/calculator-landing-content";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/rads/o-rads");

const content = getCalculatorLandingContent("/tools/calc/rads/o-rads")!;

export default function OradsProPage() {
  return (
    <CalculatorLandingShell content={content}>
      <OradsProFlow />
      <div className="mx-auto max-w-4xl px-4 pb-8">
        <ModuleProgressWidget moduleId="orads" eventType="case_complete" />
      </div>
    </CalculatorLandingShell>
  );
}
