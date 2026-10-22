import { FmfAssistantClient, type FmfAssistantSection } from "@/components/clinical-assistant/FmfEarlyAssistantClient";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/ai/consultants/fmf");

type Props = { searchParams: Promise<{ section?: string }> };

function parseSection(value?: string): FmfAssistantSection {
  if (
    value === "first" ||
    value === "second" ||
    value === "third" ||
    value === "doppler" ||
    value === "cervix" ||
    value === "scar"
  ) {
    return value;
  }
  return "early";
}

export default async function AiConsultantsFmfPage({ searchParams }: Props) {
  const { section } = await searchParams;
  return <FmfAssistantClient initialSection={parseSection(section)} />;
}
