import { ClinicalBrainClient } from "@/components/clinical-assistant/ClinicalBrainClient";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/ai/consultants/brain");

export default function AiConsultantsBrainPage() {
  return <ClinicalBrainClient />;
}