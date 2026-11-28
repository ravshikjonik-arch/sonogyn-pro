import type { Metadata } from "next";

import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

import { MyomaCalculatorsClient } from "@/components/education/myoma/MyomaCalculatorsClient";
import { myomaDefinitions } from "@repo/myoma-education";

export const metadata = buildPublicMetadata({
  title: "Калькуляторы описания миомы",
  description: "Объём, интрамуральный компонент, FIGO, динамика и допплеровские индексы.",
  path: "/tools/refs/myoma-education/calculators",
});

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
