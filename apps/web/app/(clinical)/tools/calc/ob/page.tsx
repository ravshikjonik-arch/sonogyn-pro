import { ObCalcHub } from "@/components/calculators/ob/ObCalcHub";

export const metadata = {
  title: "Калькулятор расчёта срока беременности · SonoGyn",
  description: "Калькулятор срока беременности: ПМП, УЗИ, КТР, СВД, ЭКО, фетометрия, декрет.",
};

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
