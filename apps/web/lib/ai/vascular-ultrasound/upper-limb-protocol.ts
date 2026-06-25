/**
 * Сосуды верхних конечностей — Куликов В.П., гл. 8 (2015).
 * §8.3 методика, §8.7 протокол, §8.8 стандарты заключений.
 */

export type UlSide = "right" | "left" | "bilateral";

export type UlConclusionTemplateId =
  | "plaque"
  | "stenosis"
  | "occlusion"
  | "hypoplasia"
  | "diameter-asymmetry"
  | "aneurysm"
  | "flow-asymmetry"
  | "resistance-change"
  | "dynamic-load-response"
  | "static-load-response"
  | "av-fistula"
  | "av-fistula-stenosis"
  | "av-fistula-occlusion"
  | "extravascular-compression"
  | "dvt-occluding"
  | "dvt-non-occluding"
  | "av-malformation-vein"
  | "vein-hypoplasia"
  | "vein-aplasia"
  | "normal-arterial"
  | "normal-venous";

export type UlConclusionTemplate = {
  id: UlConclusionTemplateId;
  number: number;
  label: string;
  template: string;
  category: "arterial" | "venous" | "av-access" | "functional" | "normal";
  system: "arterial" | "venous";
};

/** §8.3.1 — стандартные точки сканирования. */
export const UL_SCANNING_ROUTE = [
  "Положение: лёжа или сидя лицом к исследователю; рука отведена от туловища.",
  "ПКА: продольное сечение из под-/надключичного доступа; I–III сегменты.",
  "Подмышечная → плечевая → бифуркация → лучевая/локтевая → запястье.",
  "Вены: те же уровни; поверхностные (медиальная/латеральная) от устья.",
  "Брахиоцефальный ствол / дуга аорты — секторный/конвекс при показаниях.",
  "AV-фистула/шунт: PSV в фистуле, приводящей артерии, отводящей вене.",
  "Трехфазный спектр в артериях — норма; монофазный дистально — стеноз проксимально.",
] as const;

/** §8.3.2 — функциональные пробы. */
export const UL_FUNCTIONAL_TESTS = [
  "Синдром грудного выхода: 5 поз — отведение 90°, наклон головы, «кисть на затылке», руки в замок сзади.",
  "Динамическая нагрузка: сжатие-разжатие кулака ~2 Гц, 1 мин — прирост PSV; <15% — стеноз.",
  "Статическая нагрузка: удержание кулака — ранняя диастола; расслабление — реактивная гиперемия.",
  "Педжет-Шреттер: сдавление ПКВ при отведении руки.",
] as const;

/** §8.7 — табличный протокол (артерии). */
export const UL_ARTERIAL_PROTOCOL_SECTIONS = [
  {
    title: "Магистральные артерии",
    fields: ["ПКА, подмышечная, плечевая — PSV, RI, характер спектра"],
  },
  {
    title: "Предплечье и кисть",
    fields: ["Лучевая, локтевая, ладонные — PSV, RI, коллатерали"],
  },
  {
    title: "AV-доступ",
    fields: [
      "PSV фистулы/шунта, анастомозы",
      "Объёмный кровоток (мл/мин) в дистальной плечевой выше шунта",
      "Табл. 8.1 — стеноз/окклюзия",
    ],
  },
  {
    title: "Функциональные пробы",
    fields: ["PSV/RI до и после динамической/статической нагрузки", "TOS-позиции — падение PSV ≥30%"],
  },
] as const;

/** §8.7 — табличный протокол (вены). */
export const UL_VENOUS_PROTOCOL_SECTIONS = [
  {
    title: "Глубокие вены",
    fields: ["ВПВ, ПКВ, подмышечная, плечевая — компрессия, фазность, симметрия"],
  },
  {
    title: "Поверхностные вены",
    fields: ["Медиальная/латеральная подкожная, кубитальная вена"],
  },
  {
    title: "Тромбоз",
    fields: [
      "Проксимальная граница, окклюзирующий/неокклюзирующий",
      "Эхогенность, флотация, компрессия",
    ],
  },
] as const;

/** §8.8 — стандарты заключения (артерии, 15 пунктов). */
export const UL_ARTERIAL_CONCLUSION_TEMPLATES: UlConclusionTemplate[] = [
  {
    id: "plaque",
    number: 1,
    system: "arterial",
    category: "arterial",
    label: "Атеросклеротическая бляшка",
    template: "Атеросклеротическая бляшка в {{vessel}} {{side}}.",
  },
  {
    id: "stenosis",
    number: 2,
    system: "arterial",
    category: "arterial",
    label: "Стеноз",
    template: "Стеноз {{percent}}% по диаметру {{vessel}} {{side}} {{withHemodynamics}} нарушением локальной гемодинамики.",
  },
  {
    id: "occlusion",
    number: 3,
    system: "arterial",
    category: "arterial",
    label: "Окклюзия",
    template: "Окклюзия {{vessel}} {{side}}.",
  },
  {
    id: "hypoplasia",
    number: 4,
    system: "arterial",
    category: "arterial",
    label: "Гипоплазия",
    template: "Гипоплазия {{vessel}} {{side}}.",
  },
  {
    id: "diameter-asymmetry",
    number: 5,
    system: "arterial",
    category: "arterial",
    label: "Асимметрия диаметров",
    template: "Асимметрия диаметров {{vessel}} с {{direction}} {{dominantSide}}.",
  },
  {
    id: "aneurysm",
    number: 6,
    system: "arterial",
    category: "arterial",
    label: "Аневризма",
    template: "Аневризма {{vessel}} {{side}}, диаметр {{sizeMm}} мм.",
  },
  {
    id: "flow-asymmetry",
    number: 7,
    system: "arterial",
    category: "arterial",
    label: "Асимметрия кровотока",
    template: "Асимметрия кровотока в {{vessel}} с {{direction}} {{dominantSide}} на {{percent}}%.",
  },
  {
    id: "resistance-change",
    number: 8,
    system: "arterial",
    category: "functional",
    label: "Сосудистое сопротивление",
    template: "{{resistanceChange}} сосудистого сопротивления в {{vessel}} {{side}}.",
  },
  {
    id: "dynamic-load-response",
    number: 9,
    system: "arterial",
    category: "functional",
    label: "Динамическая нагрузка",
    template:
      "Реакция сосудистого сопротивления на динамическую мышечную нагрузку {{side}}: {{dynamicResponse}}.",
  },
  {
    id: "static-load-response",
    number: 10,
    system: "arterial",
    category: "functional",
    label: "Статическая нагрузка",
    template:
      "Реакция сосудистого сопротивления на статическую мышечную нагрузку {{side}}: {{staticResponse}}.",
  },
  {
    id: "av-fistula",
    number: 11,
    system: "arterial",
    category: "av-access",
    label: "АВ-соустье",
    template: "Признаки артериовенозного соустья {{location}} {{side}}.",
  },
  {
    id: "av-fistula-stenosis",
    number: 12,
    system: "arterial",
    category: "av-access",
    label: "Стеноз AV-фистулы/шунта",
    template:
      "Стеноз {{stenosisPercent}} в {{anastomosisType}} анастомозе артериовенозной {{accessType}} {{side}}.",
  },
  {
    id: "av-fistula-occlusion",
    number: 13,
    system: "arterial",
    category: "av-access",
    label: "Окклюзия AV-доступа",
    template: "Окклюзия артериовенозной {{accessType}} {{side}}.",
  },
  {
    id: "extravascular-compression",
    number: 14,
    system: "arterial",
    category: "functional",
    label: "Экстравазальная компрессия ПКА",
    template: "Признаки экстравазальной компрессии подключичной артерии {{side}}.",
  },
  {
    id: "normal-arterial",
    number: 15,
    system: "arterial",
    category: "normal",
    label: "Артерии без патологии",
    template: "Признаков патологии артерий верхних конечностей не обнаружено.",
  },
];

/** §8.8 — стандарты заключения (вены, 5 пунктов). */
export const UL_VENOUS_CONCLUSION_TEMPLATES: UlConclusionTemplate[] = [
  {
    id: "dvt-occluding",
    number: 1,
    system: "venous",
    category: "venous",
    label: "Окклюзирующий тромбоз",
    template: "Признаки окклюзирующего тромбоза {{vessel}} {{side}}.",
  },
  {
    id: "dvt-non-occluding",
    number: 1,
    system: "venous",
    category: "venous",
    label: "Неокклюзирующий тромбоз",
    template: "Признаки неокклюзирующего тромбоза {{vessel}} {{side}}.",
  },
  {
    id: "av-malformation-vein",
    number: 2,
    system: "venous",
    category: "venous",
    label: "АВ-соустье (вены)",
    template: "Артериовенозное соустье {{location}} {{side}}.",
  },
  {
    id: "vein-hypoplasia",
    number: 3,
    system: "venous",
    category: "venous",
    label: "Гипоплазия вены",
    template: "Гипоплазия {{vessel}} {{side}}.",
  },
  {
    id: "vein-aplasia",
    number: 4,
    system: "venous",
    category: "venous",
    label: "Аплазия вены",
    template: "Аплазия {{vessel}} {{side}}.",
  },
  {
    id: "normal-venous",
    number: 5,
    system: "venous",
    category: "normal",
    label: "Вены без патологии",
    template: "Признаков патологии вен верхних конечностей не обнаружено.",
  },
];

export const UL_ALL_CONCLUSION_TEMPLATES: UlConclusionTemplate[] = [
  ...UL_ARTERIAL_CONCLUSION_TEMPLATES,
  ...UL_VENOUS_CONCLUSION_TEMPLATES,
];

export type UlConclusionFill = Partial<{
  side: string;
  vessel: string;
  percent: string;
  withHemodynamics: string;
  direction: string;
  dominantSide: string;
  sizeMm: string;
  resistanceChange: string;
  dynamicResponse: string;
  staticResponse: string;
  location: string;
  stenosisPercent: string;
  anastomosisType: string;
  accessType: string;
}>;

const SIDE_LABEL: Record<UlSide, string> = {
  right: "справа",
  left: "слева",
  bilateral: "с обеих сторон",
};

export function sideLabelUl(side: UlSide): string {
  return SIDE_LABEL[side];
}

export function applyUlConclusionTemplate(
  templateId: UlConclusionTemplateId,
  fill: UlConclusionFill = {},
): string {
  const tpl = UL_ALL_CONCLUSION_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return "";

  const defaults: UlConclusionFill = {
    side: fill.side ?? "справа",
    vessel: fill.vessel ?? "подключичной артерии",
    percent: fill.percent ?? "—",
    withHemodynamics: fill.withHemodynamics ?? "с",
    direction: fill.direction ?? "уменьшением",
    dominantSide: fill.dominantSide ?? "слева",
    sizeMm: fill.sizeMm ?? "—",
    resistanceChange: fill.resistanceChange ?? "Увеличение",
    dynamicResponse: fill.dynamicResponse ?? "не выражена (<15% прироста PSV)",
    staticResponse: fill.staticResponse ?? "увеличение ранней диастолы",
    location: fill.location ?? "лучевой артерии",
    stenosisPercent: fill.stenosisPercent ?? "менее 50%",
    anastomosisType: fill.anastomosisType ?? "артериальном",
    accessType: fill.accessType ?? "фистулы",
  };

  const merged = { ...defaults, ...fill };
  let text = tpl.template;
  for (const [key, value] of Object.entries(merged)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return text.replace(/\s+/g, " ").trim();
}

export function buildUlConclusionDraft(
  items: { templateId: UlConclusionTemplateId; fill?: UlConclusionFill }[],
): string {
  const lines = items
    .map(({ templateId, fill }) => applyUlConclusionTemplate(templateId, fill))
    .filter(Boolean);
  if (!lines.length) return "";
  return `${lines.join("\n")}\n\nЗаключение носит описательный характер; интерпретация — лечащим специалистом.`;
}
