import { FmfAssistantClient, type FmfAssistantSection } from "@/components/clinical-assistant/FmfEarlyAssistantClient";

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

export default async function FmfAssistantPage({ searchParams }: Props) {
  const { section } = await searchParams;
  return <FmfAssistantClient initialSection={parseSection(section)} />;
}
