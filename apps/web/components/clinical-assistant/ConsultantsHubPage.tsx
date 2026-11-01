import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import type { DomainHubGroup } from "@/lib/nav/domain-hubs";

const GROUPS: DomainHubGroup[] = [
  {
    title: "Поддержка на приёме",
    cards: [
      {
        href: "/ai/consultants/us-prep",
        title: "Live приём · голосовой брифинг УЗИ",
        description: "Микрофон → жалобы → короткий чеклист под роль врача",
        primary: true,
        badge: "Live",
      },
      {
        href: "/ai/consultants/gynecology",
        title: "Помощник гинеколога",
        description: "Нозология, УЗИ, красные флаги, протокол",
      },
      {
        href: "/ai/consultants/obstetrics",
        title: "Помощник акушера",
        description: "Ранняя беременность, потери, ГСД",
      },
      {
        href: "/ai/consultants/fmf",
        title: "FMF · скрининг",
        description: "Малый срок, триместры, допплер",
      },
      {
        href: "/ai/consultants/vascular",
        title: "Сосудистое УЗД",
        description: "БЦА, артерии и вены, аорта",
      },
    ],
  },
  {
    title: "Рядом",
    cards: [
      {
        href: "/tools/refs/evidence-assistant",
        title: "Evidence AI",
        description: "Публикации и клинические рекомендации",
      },
      {
        href: "/ai/workspace",
        title: "AI-зона · снимки",
        description: "Разбор изображения без персональных данных",
      },
      {
        href: "/tools/refs/nosologies",
        title: "Нозологии",
        description: "Алгоритмы по зонам",
      },
      {
        href: "/tools/mapping/uterus",
        title: "FIGO · миома",
        description: "Тип узла на схеме матки",
      },
      {
        href: "/tools/mapping/breast",
        title: "Молочная железа",
        description: "Макет и BI-RADS",
      },
    ],
  },
];

export function ConsultantsHubPage() {
  return (
    <ClinicalDomainHub
      title="AI-помощник"
      description="Сначала live-брифинг на приёме. Дальше — разбор без персональных данных. Решение остаётся за врачом."
      groups={GROUPS}
      backHref="/home"
      backLabel="← Разделы"
    />
  );
}
