import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import type { DomainHubCard } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/gyn");

const CARDS: DomainHubCard[] = [
  {
    href: "/tools/calc/ob",
    title: "Акушерский калькулятор",
    description: "ПМП, УЗИ, КТР, СВД, ЭКО, фетометрия, декрет, шевеления, явка в ЖК",
    primary: true,
  },
  {
    href: "/tools/calc/gyn/endometrium",
    title: "Эндометрий",
    description: "M-эхо, пороги, очаг, тамоксифен",
    primary: true,
  },
  {
    href: "/tools/calc/gyn/pop-q",
    title: "POP-Q",
    description: "Стадия пролапса по точкам Aa, Ba, C, D, Ap, Bp, TVL",
  },
  {
    href: "/tools/calc/gyn/colposcopy",
    title: "Кольпоскопия · Swede",
    description: "Протокол и 5 признаков IFCPC",
  },
  {
    href: "/tools/calc/gyn/cin-risk",
    title: "CIN Risk",
    description: "HPV, Bethesda, зона трансформации",
  },
  {
    href: "/tools/calc/gyn/cin-follow-up",
    title: "Наблюдение после CIN",
    description: "Контроль после лечения шейки",
  },
  {
    href: "/tools/calc/gyn/cervical-intelligence",
    title: "Шейка · CDS",
    description: "IFCPC, HPV, Bethesda, действия",
  },
  {
    href: "/tools/calc/gyn/elastography",
    title: "Эластография",
    description: "Strain и SWE: шейка, миометрий, яичники, молочная железа",
  },
  {
    href: "/tools/calc/gyn/breast-risk",
    title: "Риск рака молочной железы",
    description: "Ориентир риска, не диагноз",
  },
  {
    href: "/tools/calc/gyn/cervical-cancer-risk",
    title: "Риск рака шейки матки",
    description: "Ориентир риска, не диагноз",
  },
  {
    href: "/tools/calc/gyn/ovarian-cancer-risk",
    title: "Риск рака яичников",
    description: "Ориентир риска, не диагноз",
  },
  {
    href: "/tools/calc/gyn/ultrasound-10-steps",
    title: "УЗИ малого таза · 10 шагов",
    description: "Пошаговый протокол осмотра",
  },
  {
    href: "/tools/calc/rads/o-rads",
    title: "O-RADS US",
    description: "Стратификация образований придатков",
  },
  {
    href: "/tools/mapping/uterus",
    title: "FIGO · миома",
    description: "Тип миомы на макете матки",
  },
];

export default function GynCalculatorsPage() {
  return (
    <ClinicalDomainHub
      kicker="Гинекология"
      title="Калькуляторы гинекологии"
      description="Калькуляторы срока, массы, Бишопа и рисков стоят списком в пункте «Акушерский калькулятор»."
      cards={CARDS}
      backHref="/tools/calc"
      backLabel="← Все калькуляторы"
    />
  );
}
