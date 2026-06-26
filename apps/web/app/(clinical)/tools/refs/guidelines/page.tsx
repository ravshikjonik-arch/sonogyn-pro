import { ClinicalGuidelinesCatalog } from "@/components/guidelines/ClinicalGuidelinesWidget";

export const metadata = {
  title: "Клинические рекомендации и приказы",
  description: "КР Минздрава РФ, приказы ДЗМ, локальные протоколы — отдельные полки",
};

export default function GuidelinesPage() {
  return <ClinicalGuidelinesCatalog />;
}
