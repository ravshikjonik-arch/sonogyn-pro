import type { Metadata } from "next";

import { FmfSectionClient } from "@/components/fmf/FmfSectionClient";

export const metadata: Metadata = {
  title: "FMF · скрининг 11–13 недель",
  description:
    "Учебный раздел FMF: техника NT, допплер I триместра, 6 assessment-калькуляторов (dating, NT, EFW, birth weight, Doppler, UtA PI). Не диагноз.",
};

export default function Fmf1113Page() {
  return <FmfSectionClient />;
}