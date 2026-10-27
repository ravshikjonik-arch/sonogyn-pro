import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import type { DomainHubGroup } from "@/lib/nav/domain-hubs";
import { calculatorPageMetadata } from "@/lib/seo/calculator-seo-registry";

export const metadata = calculatorPageMetadata("/tools/calc/gyn");

const GROUPS: DomainHubGroup[] = [
  {
    title: "Срок и риски",
    cards: [
      {
        href: "/tools/calc/ob",
        title: "Акушерский калькулятор",
        description: "Срок, фетометрия и гинекологические риски",
        primary: true,
      },
    ],
  },
  {
    title: "Матка",
    cards: [
      {
        href: "/tools/calc/gyn/endometrium",
        title: "Эндометрий",
        description: "M-эхо, пороги, очаг",
        primary: true,
      },
      {
        href: "/tools/calc/gyn/pop-q",
        title: "POP-Q",
        description: "Стадия пролапса",
      },
      {
        href: "/tools/mapping/uterus",
        title: "FIGO · миома",
        description: "Тип узла на схеме матки",
      },
    ],
  },
  {
    title: "Шейка матки",
    cards: [
      {
        href: "/tools/calc/gyn/colposcopy",
        title: "Кольпоскопия",
        description: "Протокол и признаки",
      },
      {
        href: "/tools/calc/gyn/cin-risk",
        title: "Риск CIN",
        description: "HPV, Bethesda, зона трансформации",
      },
      {
        href: "/tools/calc/gyn/cin-follow-up",
        title: "Наблюдение после CIN",
        description: "Контроль после лечения",
      },
      {
        href: "/tools/calc/gyn/cervical-intelligence",
        title: "Шейка · разбор",
        description: "Цитология и следующий шаг",
      },
      {
        href: "/tools/calc/gyn/cervical-cancer-risk",
        title: "Риск рака шейки матки",
        description: "Ориентир, не диагноз",
      },
    ],
  },
  {
    title: "Яичники и молочная железа",
    cards: [
      {
        href: "/tools/calc/rads/o-rads",
        title: "O-RADS",
        description: "Образования придатков",
      },
      {
        href: "/tools/calc/gyn/ovarian-cancer-risk",
        title: "Риск рака яичников",
        description: "Ориентир, не диагноз",
      },
      {
        href: "/tools/calc/gyn/breast-risk",
        title: "Риск рака молочной железы",
        description: "Ориентир, не диагноз",
      },
      {
        href: "/tools/calc/gyn/elastography",
        title: "Эластография",
        description: "Шейка, миометрий, яичники, молочная железа",
      },
      {
        href: "/tools/calc/gyn/ultrasound-10-steps",
        title: "УЗИ малого таза · 10 шагов",
        description: "Пошаговый осмотр",
      },
    ],
  },
];

export default function GynCalculatorsPage() {
  return (
    <ClinicalDomainHub
      title="Гинекология"
      description="Калькуляторы по нозологиям. Срок и гинекологические риски — в акушерском калькуляторе."
      groups={GROUPS}
      backHref="/home"
      backLabel="← Разделы"
    />
  );
}
