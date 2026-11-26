import type { Metadata } from "next";

import { FmfSectionClient } from "@/components/fmf/FmfSectionClient";

export const metadata: Metadata = {
  title: "FMF · скрининг 11–13 недель",
  description:
    "Учебный раздел FMF: техника ТВП, допплер I триместра, 6 калькуляторов оценки (датирование, ТВП, ПВМ, вес при рождении, допплер, PI МА). Не диагноз.",
};

export default function Fmf1113Page() {
  return <FmfSectionClient />;
}