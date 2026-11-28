import { ClinicalGuidelinesCatalog } from "@/components/guidelines/ClinicalGuidelinesWidget";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata = buildPublicMetadata({
  title: "Клинические рекомендации и приказы",
  description: "КР Минздрава РФ, приказы ДЗМ, локальные протоколы — отдельные полки",
  path: "/tools/refs/guidelines",
});

export default function GuidelinesPage() {
  return <ClinicalGuidelinesCatalog />;
}
