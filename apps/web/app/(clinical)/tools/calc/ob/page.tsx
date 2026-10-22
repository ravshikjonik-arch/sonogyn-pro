import { ObCalcHub } from "@/components/calculators/ob/ObCalcHub";

import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";
export const metadata = calculatorPageMetadata("/tools/calc/ob");

const TABS = ["lmp", "us", "crl", "msd", "ivf", "feto", "dekret", "edd", "movement", "antenatal"] as const;
type TabId = (typeof TABS)[number];

function parseTab(value?: string): TabId {
  return TABS.includes(value as TabId) ? (value as TabId) : "lmp";
}

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function ObCalcPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  return <ObCalcHub initialTab={parseTab(tab)} />;
}
