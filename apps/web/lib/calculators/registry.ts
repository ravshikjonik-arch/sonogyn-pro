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
    externalHref: "/tools/calc/gyn/elastography",
    fields: [],
  },
  {
    slug: "o-rads",
    code: "O_RADS",
    title: "O-RADS Pro",
    subtitle: "O-RADS US v2022 + IOTA 2026 — полный калькулятор яичника",
    externalHref: "/tools/calc/rads/o-rads",
    fields: [],
  },
  {
    slug: "bi-rads",
    code: "BI_RADS_US",
    title: "BI-RADS US Pro",
    subtitle: "Быстрый калькулятор · брошюра v2025 · атлас · AI Assistant + US Worker",
    externalHref: "/tools/calc/rads/bi-rads",
    fields: [],
  },
  {
    slug: "endometrium",
    code: "ENDOMETRIUM_ISUOG",
    title: "Эндометрий · ISUOG / КР РФ",
    subtitle: "M-эхо, пороги, очаг, тамоксифен — протокол и экспорт",
    externalHref: "/tools/calc/gyn/endometrium",
    fields: [],
  },
  {
    slug: "cervical-length",
    code: "CERVICAL_LENGTH",
    title: "Длина шейки матки (CL)",
    subtitle: "Скрининг 16–24 нед, воронка T/Y/V/U, sludge",
    externalHref: "/tools/calc/ob/cervical-length",
    fields: [],
  },
  {
    slug: "figo",
    code: "FIGO_FIBROID",
    title: "FIGO fibroid typing",
    subtitle: "Morphology / mural mapping",
    externalHref: "/tools/mapping/uterus",
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
    title: "LN-RADS US Pro",
    subtitle: "Morphology · Doppler · Atlas · Academy · AI · Cases · Board",
    externalHref: "/tools/calc/rads/ln-rads",
    fields: [],
  },
  {
    slug: "ti-rads",
    code: "TI_RADS",
    title: "TI-RADS ЩЖ",
    subtitle: "ACR TI-RADS Pro · Pattern Recognition · FNA · РФ 2023",
    externalHref: "/tools/adjunct/ti-rads",
    fields: [],
  },
  {
    slug: "pop-q",
    code: "POP_Q",
    title: "POP-Q · русская версия",
    subtitle: "Золотой стандарт стадирования пролапса по точкам Aa/Ba/C/D/Ap/Bp/TVL",
    externalHref: "/tools/calc/gyn/pop-q",
    fields: [],
  },
  {
    slug: "colposcopy",
    code: "COLOPOSCOPY_SWEDE",
    title: "Кольпоскопия · Swede Score",
    subtitle: "Протокол по бланку, 5 признаков IFCPC, риск CIN 2+, PDF",
    externalHref: "/tools/calc/gyn/colposcopy",
    fields: [],
  },
  {
    slug: "cin-risk",
    code: "CIN_RISK",
    title: "CIN Risk · IFCPC Expert",
    subtitle: "CIN1–3, AIS, инвазия — HPV, Bethesda, TZ, IFCPC, logit-модель",
    externalHref: "/tools/calc/gyn/cin-risk",
    fields: [],
  },
  {
    slug: "cervical-intelligence",
    code: "CPI_CDS",
    title: "Cervical Pathology Intelligence",
    subtitle: "CDS: IFCPC + HPV + Bethesda + TZ3 + AIS + Quality + 8 actions",
    externalHref: "/tools/calc/gyn/cervical-intelligence",
    fields: [],
  },
  {
    slug: "ob-calc",
    code: "OB_CALC",
    title: "Калькулятор расчёта срока беременности",
    subtitle: "ПМП, УЗИ, КТР, ЭКО, фетометрия, декрет, шевеления, явка в ЖК",
    externalHref: "/tools/calc/ob",
    fields: [],
  },
  {
    slug: "fetal-weight",
    code: "EFW",
    title: "Масса плода",
    subtitle: "Hadlock, Рудаков, антропометрия матери",
    externalHref: "/tools/calc/ob/fetal-weight",
    fields: [],
  },
  {
    slug: "bishop",
    code: "BISHOP",
    title: "Шкала Бишопа",
    subtitle: "Созревание шейки перед индукцией",
    externalHref: "/tools/calc/ob/bishop",
    fields: [],
  },
  {
    slug: "vbac",
    code: "VBAC",
    title: "VBAC / TOLAC",
    subtitle: "До родов и в родах после кесарева сечения",
    externalHref: "/tools/calc/ob/vbac",
    fields: [],
  },
  {
    slug: "pregnancy-medications",
    code: "PREG_MEDS",
    title: "Лекарства при беременности",
    subtitle: "Справочник категорий FDA (ориентир)",
    externalHref: "/tools/calc/ob/pregnancy-medications",
    fields: [],
  },
  {
    slug: "fmf",
    code: "FMF_FIRST_TRIMESTER",
    title: "FMF · малый срок и I скрининг",
    subtitle: "Малый срок · I/II/III · допплер · шейка · рубец",
    externalHref: "/ai/consultants/fmf",
    fields: [],
  },
];

export function getCalculatorBySlug(slug: string): CalculatorDefinition | undefined {
  return CALCULATORS.find((c) => c.slug === slug);
}
