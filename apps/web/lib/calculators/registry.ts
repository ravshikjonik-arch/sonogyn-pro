export type CalculatorDefinition = {
  slug: string;
  code: string;
  title: string;
  subtitle: string;
  /** Если задан — карточка ведёт на этот URL вместо /calculators/[slug] */
  externalHref?: string;
  /** Keys stored in payload JSON */
  fields: { key: string; label: string; type: "select" | "number" | "text"; options?: string[] }[];
};

export const CALCULATORS: CalculatorDefinition[] = [
  {
    slug: "elastography",
    code: "ELASTOGRAPHY",
    title: "Эластография",
    subtitle: "Strain / SWE — шейка, миометрий, яичники, МЖ",
    fields: [],
  },
  {
    slug: "o-rads",
    code: "O_RADS",
    title: "O-RADS Pro",
    subtitle: "O-RADS US v2022 + IOTA 2026 — полный калькулятор яичника",
    externalHref: "/calculators/o-rads",
    fields: [],
  },
  {
    slug: "bi-rads",
    code: "BI_RADS_US",
    title: "BI-RADS US — алгоритм v2025",
    subtitle: "8 шагов по брошюре Солнцевой И.А. + локализация МЖ",
    externalHref: "/calculators/bi-rads",
    fields: [],
  },
  {
    slug: "endometrium",
    code: "ENDOMETRIUM_ISUOG",
    title: "Эндометрий · ISUOG / КР РФ",
    subtitle: "M-эхо, пороги, очаг, тамоксифен — протокол и экспорт",
    externalHref: "/calculators/endometrium",
    fields: [],
  },
  {
    slug: "cervical-length",
    code: "CERVICAL_LENGTH",
    title: "Длина шейки матки (CL)",
    subtitle: "Скрининг 16–24 нед, воронка T/Y/V/U, sludge",
    externalHref: "/calculators/cervical-length",
    fields: [],
  },
  {
    slug: "figo",
    code: "FIGO_FIBROID",
    title: "FIGO fibroid typing",
    subtitle: "Morphology / mural mapping",
    externalHref: "/uterus-3d",
    fields: [
      {
        key: "figoType",
        label: "FIGO type (0–8)",
        type: "select",
        options: ["0", "1", "2", "3", "4", "5", "6", "7", "8"],
      },
      { key: "notes", label: "Clinical context", type: "text" },
    ],
  },
  {
    slug: "ln-rads",
    code: "LN_RADS",
    title: "LN-RADS",
    subtitle: "Lymph node ultrasound descriptors",
    fields: [
      {
        key: "suspicion",
        label: "Suspicion level",
        type: "select",
        options: ["benign-appearing", "intermediate", "suspicious"],
      },
      { key: "notes", label: "Location / correlate", type: "text" },
    ],
  },
  {
    slug: "ti-rads",
    code: "TI_RADS",
    title: "TI-RADS",
    subtitle: "Thyroid nodule risk stratification",
    fields: [
      {
        key: "category",
        label: "EU-TIRADS–style category",
        type: "select",
        options: ["1–2", "3", "4", "5"],
      },
      { key: "notes", label: "Size / elastography notes", type: "text" },
    ],
  },
  {
    slug: "pop-q",
    code: "POP_Q",
    title: "POP-Q",
    subtitle: "Pelvic organ prolapse grid",
    fields: [
      { key: "Aa", label: "Aa", type: "text" },
      { key: "Ba", label: "Ba", type: "text" },
      { key: "C", label: "C", type: "text" },
      { key: "notes", label: "Stage / comments", type: "text" },
    ],
  },
  {
    slug: "fmf",
    code: "FMF_FIRST_TRIMESTER",
    title: "FMF · малый срок и I скрининг",
    subtitle: "Малый срок · I/II/III · допплер · шейка · рубец",
    externalHref: "/assistant/fmf",
    fields: [],
  },
];

export function getCalculatorBySlug(slug: string): CalculatorDefinition | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}
