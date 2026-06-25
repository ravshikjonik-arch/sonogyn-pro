/**
 * Брюшная аорта и висцеральные ветви — Куликов В.П., гл. 9 (2015).
 * §9.3 методика, §9.8 протокол, §9.9 стандарты заключений.
 */

export type AaaSide = "right" | "left" | "bilateral";

export type AaaConclusionTemplateId =
  | "small-plaques"
  | "plaque"
  | "aortic-stenosis"
  | "aneurysm"
  | "aneurysm-thrombus"
  | "aneurysm-iliac"
  | "dissection"
  | "aortoarteritis"
  | "renal-stenosis"
  | "renal-occlusion"
  | "renal-course-deformity"
  | "renal-hypoplasia"
  | "renal-occlusion-suspect"
  | "renal-duplication"
  | "renal-aneurysm"
  | "renal-resistance"
  | "renal-flow-asymmetry"
  | "visceral-stenosis"
  | "visceral-occlusion"
  | "celiac-compression"
  | "visceral-resistance"
  | "visceral-aneurysm"
  | "normal-aorta"
  | "normal-renal"
  | "normal-visceral";

export type AaaConclusionTemplate = {
  id: AaaConclusionTemplateId;
  number: number;
  label: string;
  template: string;
  category: "aorta" | "renal" | "visceral" | "normal";
};

/** §9.3.1 — маршрут сканирования. */
export const AAA_SCANNING_ROUTE = [
  "Натощак 8–12 ч; лёжа на спине, задержка дыхания на вдохе.",
  "Аорта: поперечное сечение — наружный диаметр (супра-/интра-/инфраренально).",
  "ЧС → ОПеА/СА («крылья чайки»); ВБА — исток и дистально; НБА (~2/3 случаев).",
  "ПчА: исток, ворота, сегментарные/междолевые; RAR = PSV ПчА / PSV аорты.",
  "Почечные вены: фазность; левая ПВ — аортомезентериальный пинцет.",
  "Эндопротез: просачивание из точек фиксации, боковых ветвей, ретроградно.",
] as const;

/** §9.3.2 — функциональные пробы. */
export const AAA_FUNCTIONAL_TESTS = [
  "Дыхательная проба на ЭКЧС: PSV ЧС на вдохе vs выдохе (порог +80%).",
  "RI в СА на выдохе — ишемия бассейна ЧС.",
  "PSV аорты <50 см/с — расчёт RAR некорректен.",
] as const;

/** §9.8 — протокол аорты и висцеральных ветвей. */
export const AAA_AORTA_PROTOCOL_SECTIONS = [
  {
    title: "Аорта",
    fields: [
      "Диаметр супра-/интра-/инфраренальный, мм",
      "Бляшки, стеноз %, аневризма, расслоение",
      "Тромб в мешке, функционирующий просвет",
    ],
  },
  {
    title: "Висцеральные артерии",
    fields: ["ЧС (вдох/выдох), ОПеА, СА, ВБА — PSV, RI, характер спектра"],
  },
] as const;

/** §9.8 — протокол почечных артерий. */
export const AAA_RENAL_PROTOCOL_SECTIONS = [
  {
    title: "Почечные артерии",
    fields: [
      "Правая/левая ПчА: исток, ворота, сегментарные, междолевые",
      "RAR (N <3,5); RI сегментарных ≤0,7",
      "Удвоение/добавочная ПчА",
    ],
  },
  {
    title: "Почечные вены",
    fields: ["Компрессия/фазность; пинцет — отношение диаметра/скорости ≥4"],
  },
] as const;

/** §9.9 — стандарты заключения: аорта (9 пунктов). */
export const AAA_AORTA_CONCLUSION_TEMPLATES: AaaConclusionTemplate[] = [
  {
    id: "small-plaques",
    number: 1,
    category: "aorta",
    label: "Множественные мелкие АСБ",
    template: "Множественные мелкие атеросклеротические бляшки брюшного отдела аорты.",
  },
  {
    id: "plaque",
    number: 2,
    category: "aorta",
    label: "Атеросклеротическая бляшка",
    template: "Атеросклеротическая бляшка {{location}} брюшного отдела аорты.",
  },
  {
    id: "aortic-stenosis",
    number: 3,
    category: "aorta",
    label: "Стеноз аорты",
    template: "Стеноз брюшного отдела аорты {{percent}}%.",
  },
  {
    id: "aneurysm",
    number: 4,
    category: "aorta",
    label: "Аневризма",
    template: "Аневризма {{segment}} отдела аорты {{diameterMm}} мм.",
  },
  {
    id: "aneurysm-thrombus",
    number: 5,
    category: "aorta",
    label: "Аневризма с тромбозом",
    template:
      "Аневризма {{segment}} отдела аорты {{diameterMm}} мм с пристеночным тромбозом{{complication}}.",
  },
  {
    id: "aneurysm-iliac",
    number: 6,
    category: "aorta",
    label: "Аневризма с подвздошными",
    template: "Аневризма инфраренального отдела брюшной аорты {{diameterMm}} мм с вовлечением подвздошных артерий.",
  },
  {
    id: "dissection",
    number: 7,
    category: "aorta",
    label: "Расслоение",
    template:
      "Расслоение стенки аорты с дистальным распространением до {{segment}} отдела{{iliacInvolvement}}.",
  },
  {
    id: "aortoarteritis",
    number: 8,
    category: "aorta",
    label: "Аортоартериит",
    template: "Признаки неспецифического аортоартериита.",
  },
  {
    id: "normal-aorta",
    number: 9,
    category: "normal",
    label: "Аорта без патологии",
    template: "Признаков патологии брюшного отдела аорты не обнаружено.",
  },
];

/** §9.9 — почечные артерии (10 пунктов). */
export const AAA_RENAL_CONCLUSION_TEMPLATES: AaaConclusionTemplate[] = [
  {
    id: "renal-stenosis",
    number: 1,
    category: "renal",
    label: "Стеноз ПчА",
    template: "Стеноз почечной артерии {{side}} в {{level}}, {{percent}}% по гемодинамике.",
  },
  {
    id: "renal-occlusion",
    number: 2,
    category: "renal",
    label: "Окклюзия ПчА",
    template: "Окклюзия почечной артерии {{side}}.",
  },
  {
    id: "renal-course-deformity",
    number: 3,
    category: "renal",
    label: "Нарушение хода",
    template: "Нарушение хода, деформация почечной артерии {{side}}.",
  },
  {
    id: "renal-hypoplasia",
    number: 4,
    category: "renal",
    label: "Гипоплазия ПчА",
    template: "Гипоплазия почечной артерии {{side}}.",
  },
  {
    id: "renal-occlusion-suspect",
    number: 5,
    category: "renal",
    label: "Окклюзия/аплазия — под вопросом",
    template: "Нельзя исключить окклюзию или аплазию почечной артерии {{side}}.",
  },
  {
    id: "renal-duplication",
    number: 6,
    category: "renal",
    label: "Удвоение ПчА",
    template: "Удвоение почечной артерии {{side}}{{accessoryNote}}.",
  },
  {
    id: "renal-aneurysm",
    number: 7,
    category: "renal",
    label: "Аневризма ПчА",
    template: "Аневризма почечной артерии {{side}}, диаметр {{diameterMm}} мм.",
  },
  {
    id: "renal-resistance",
    number: 8,
    category: "renal",
    label: "Изменение сопротивления",
    template: "{{resistanceChange}} сосудистого сопротивления в артериях {{side}} почки.",
  },
  {
    id: "renal-flow-asymmetry",
    number: 9,
    category: "renal",
    label: "Асимметрия кровотока",
    template: "Асимметрия кровотока в почечных артериях со снижением {{dominantSide}}.",
  },
  {
    id: "normal-renal",
    number: 10,
    category: "normal",
    label: "Почки без патологии",
    template: "Признаков патологии почечных артерий не обнаружено.",
  },
];

/** §9.9 — ЧС, ВБА, ОПеА, СА (6 пунктов). */
export const AAA_VISCERAL_CONCLUSION_TEMPLATES: AaaConclusionTemplate[] = [
  {
    id: "visceral-stenosis",
    number: 1,
    category: "visceral",
    label: "Стеноз висцеральной ветви",
    template: "Гемодинамически значимый стеноз {{percent}}% {{vessel}}.",
  },
  {
    id: "visceral-occlusion",
    number: 2,
    category: "visceral",
    label: "Окклюзия",
    template: "Окклюзия {{vessel}}.",
  },
  {
    id: "celiac-compression",
    number: 3,
    category: "visceral",
    label: "ЭКЧС",
    template: "Признаки экстравазальной компрессии чревного ствола.",
  },
  {
    id: "visceral-resistance",
    number: 4,
    category: "visceral",
    label: "Сопротивление в бассейне",
    template: "{{resistanceChange}} сосудистого сопротивления в бассейне {{vessel}}.",
  },
  {
    id: "visceral-aneurysm",
    number: 5,
    category: "visceral",
    label: "Аневризма висцеральной ветви",
    template: "Аневризма {{vessel}}, диаметр {{diameterMm}} мм.",
  },
  {
    id: "normal-visceral",
    number: 6,
    category: "normal",
    label: "Висцеральные без патологии",
    template: "Признаков патологии висцеральных ветвей аорты не обнаружено.",
  },
];

export const AAA_ALL_CONCLUSION_TEMPLATES: AaaConclusionTemplate[] = [
  ...AAA_AORTA_CONCLUSION_TEMPLATES,
  ...AAA_RENAL_CONCLUSION_TEMPLATES,
  ...AAA_VISCERAL_CONCLUSION_TEMPLATES,
];

export type AaaConclusionFill = Partial<{
  side: string;
  location: string;
  segment: string;
  diameterMm: string;
  percent: string;
  level: string;
  complication: string;
  iliacInvolvement: string;
  accessoryNote: string;
  resistanceChange: string;
  dominantSide: string;
  vessel: string;
}>;

const SIDE_LABEL: Record<AaaSide, string> = {
  right: "справа",
  left: "слева",
  bilateral: "с обеих сторон",
};

export function sideLabelAaa(side: AaaSide): string {
  return SIDE_LABEL[side];
}

export function applyAaaConclusionTemplate(
  templateId: AaaConclusionTemplateId,
  fill: AaaConclusionFill = {},
): string {
  const tpl = AAA_ALL_CONCLUSION_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return "";

  const defaults: AaaConclusionFill = {
    side: fill.side ?? "справа",
    location: fill.location ?? "инфраренального",
    segment: fill.segment ?? "инфраренального",
    diameterMm: fill.diameterMm ?? "—",
    percent: fill.percent ?? "—",
    level: fill.level ?? "истоке",
    complication: fill.complication ?? "",
    iliacInvolvement: fill.iliacInvolvement ?? "",
    accessoryNote: fill.accessoryNote ?? "",
    resistanceChange: fill.resistanceChange ?? "Увеличение",
    dominantSide: fill.dominantSide ?? "слева",
    vessel: fill.vessel ?? "чревного ствола",
  };

  const merged = { ...defaults, ...fill };
  let text = tpl.template;
  for (const [key, value] of Object.entries(merged)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return text.replace(/\s+/g, " ").trim();
}

export function buildAaaConclusionDraft(
  items: { templateId: AaaConclusionTemplateId; fill?: AaaConclusionFill }[],
): string {
  const lines = items
    .map(({ templateId, fill }) => applyAaaConclusionTemplate(templateId, fill))
    .filter(Boolean);
  if (!lines.length) return "";
  return `${lines.join("\n")}\n\nЗаключение носит описательный характер; интерпретация — лечащим специалистом.`;
}
