import type { Metadata } from "next";

import { MyomaCalculatorsClient } from "@/components/education/myoma/MyomaCalculatorsClient";
import { myomaDefinitions } from "@repo/myoma-education";

export const metadata: Metadata = {
  title: "Калькуляторы описания миомы | SonoGyn Pro",
  description: "Объём, интрамуральный компонент, FIGO, динамика и допплеровские индексы.",
  robots: { index: false, follow: false },
};

export default function MyomaCalculatorsPage() {
  const byId = Object.fromEntries(myomaDefinitions.calculators.map((item) => [item.id, item]));
  const figo = byId["figo-classification"];
  const growth = byId["growth-dynamics"];
  const doppler = byId["doppler-indices"];

  return (
    <MyomaCalculatorsClient
      disclaimer={myomaDefinitions.disclaimer}
      figoNote={"note" in (figo ?? {}) ? String((figo as { note?: string }).note ?? "") : ""}
      growthWarning={"warning" in (growth ?? {}) ? String((growth as { warning?: string }).warning ?? "") : ""}
      dopplerWarning={"warning" in (doppler ?? {}) ? String((doppler as { warning?: string }).warning ?? "") : ""}
    />
  );
}
