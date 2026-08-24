import { TiradsProFlow } from "@/components/calculators/tirads/TiradsProFlow";

export const metadata = {
  title: "TI-RADS ЩЖ · SonoGyn",
  description:
    "ACR TI-RADS Pro: Анализ → Доклад → Store, scoring TR1–TR5, Pattern Recognition, FNA, AI · РФ 2023",
};

/** Canonical RADS path — same family as O-RADS / BI-RADS / LN-RADS. */
export default function TiradsRadsPage() {
  return <TiradsProFlow />;
}
