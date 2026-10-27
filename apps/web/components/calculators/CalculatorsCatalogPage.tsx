import { ClinicalDomainHub } from "@/components/clinical/ClinicalDomainHub";
import { CALCULATORS } from "@/lib/calculators/registry";
import { resolveCalculatorHref } from "@/lib/calculators/resolve-calculator-href";
import type { DomainHubCard, DomainHubGroup } from "@/lib/nav/domain-hubs";

const GROUP_SLUGS: { title: string; slugs: string[] }[] = [
  {
    title: "Акушерство",
    slugs: ["ob-calc", "fmf", "cervical-length", "fetometry-norms", "fetal-weight", "bishop", "vbac"],
  },
  {
    title: "Гинекология",
    slugs: ["endometrium", "pop-q", "figo", "colposcopy", "cin-risk", "cervical-intelligence", "elastography"],
  },
  {
    title: "RADS",
    slugs: ["o-rads", "iota", "bi-rads", "ti-rads", "ln-rads"],
  },
  {
    title: "Аптека",
    slugs: ["pregnancy-medications"],
  },
];

const RU: Record<string, { title: string; description: string }> = {
  "ob-calc": { title: "Акушерский калькулятор", description: "Срок, фетометрия, декрет, явка в консультацию" },
  figo: { title: "FIGO · миома", description: "Тип узла на схеме матки" },
  "cervical-intelligence": { title: "Шейка · разбор", description: "Цитология и следующий шаг" },
  "cin-risk": { title: "Риск CIN", description: "HPV, Bethesda, зона трансформации" },
  colposcopy: { title: "Кольпоскопия", description: "Протокол и признаки" },
  "ln-rads": { title: "LN-RADS", description: "Лимфоузлы" },
};

function cardFor(slug: string): DomainHubCard | null {
  const calc = CALCULATORS.find((item) => item.slug === slug);
  if (!calc) return null;
  const ru = RU[slug];
  return {
    href: resolveCalculatorHref(calc),
    title: ru?.title ?? calc.title,
    description: ru?.description ?? calc.subtitle,
  };
}

export function CalculatorsCatalogPage() {
  const used = new Set(GROUP_SLUGS.flatMap((group) => group.slugs));
  const groups: DomainHubGroup[] = GROUP_SLUGS.map((group) => ({
    title: group.title,
    cards: group.slugs.map(cardFor).filter((card): card is DomainHubCard => card !== null),
  }));
  const rest = CALCULATORS.filter((calc) => !used.has(calc.slug)).map((calc) => ({
    href: resolveCalculatorHref(calc),
    title: calc.title,
    description: calc.subtitle,
  }));
  if (rest.length > 0) groups.push({ title: "Ещё", cards: rest });
  groups.push({
    title: "Приём",
    cards: [
      {
        href: "/tools/calc/appointment",
        title: "Быстрый доступ на приёме",
        description: "Срок, ПДР, масса, Bishop и VBAC на одном экране",
      },
    ],
  });

  return (
    <ClinicalDomainHub
      title="Калькуляторы"
      description="Акушерство, гинекология, RADS и аптека. Справочная поддержка, не диагноз."
      groups={groups}
      backHref="/home"
      backLabel="← Разделы"
    />
  );
}
