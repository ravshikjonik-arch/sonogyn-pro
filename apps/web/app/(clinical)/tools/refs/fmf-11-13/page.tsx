import { FmfSectionClient } from "@/components/fmf/FmfSectionClient";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "FMF · скрининг 11–13 недель",
  description:
    "Учебный раздел FMF: техника ТВП, допплер I триместра, 6 калькуляторов оценки (датирование, ТВП, ПВМ, вес при рождении, допплер, PI МА). Не диагноз.",
  path: "/tools/refs/fmf-11-13",
  skipCdsDisclaimer: true,
});

export default function Fmf1113Page() {
  return <FmfSectionClient />;
}