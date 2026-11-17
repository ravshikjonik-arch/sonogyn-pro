import { EmergencyAssistantClient } from "@/components/clinical-assistant/EmergencyAssistantClient";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/emergency");

type Props = { searchParams: Promise<{ q?: string }> };

/** Единое окно: хаб + помощник СМП + KB неотложки. */
export default async function EmergencyHubPage({ searchParams }: Props) {
  const { q } = await searchParams;
  return <EmergencyAssistantClient initialQuery={q ?? ""} />;
}
