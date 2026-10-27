import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { TOOLS_HOME_DOMAINS, type DomainHubGroup } from "@/lib/nav/domain-hubs";

const GROUPS: DomainHubGroup[] = [
  {
    title: "Специальности",
    cards: TOOLS_HOME_DOMAINS.map((domain) => ({
      href: domain.href,
      title: domain.title,
      description: domain.description,
    })),
  },
  {
    title: "Ещё",
    cards: [
      {
        href: "/tools/pharmacy",
        title: "Аптека врача",
        description: "Препараты для практики",
      },
      {
        href: "/tools/refs",
        title: "Справочник",
        description: "КР, нормы, атласы и курсы",
      },
      {
        href: "/tools/mapping",
        title: "Анатомические макеты",
        description: "Матка, яичник, молочная железа",
      },
      {
        href: "/cases",
        title: "Чат врачей",
        description: "Общий канал",
      },
    ],
  },
];

export default function ToolsHubPage() {
  return (
    <ClinicalDomainHub
      title="Кабинет"
      description="Те же разделы, что на главной: по специальностям и нозологиям."
      groups={GROUPS}
      backHref="/home"
      backLabel="← Разделы"
    />
  );
}
