/**
 * Артерии нижних конечностей — Куликов В.П., гл. 6 (2015).
 * §6.3 методика, §6.7 протокол, §6.8 стандарты заключений.
 */

export type LlaSide = "right" | "left" | "bilateral";

export type LlaConclusionTemplateId =
  | "small-plaques"
  | "plaque"
  | "takayasu"
  | "buerger"
  | "stenosis"
  | "occlusion"
  | "abi-reduced"
  | "hypoplasia"
  | "diameter-asymmetry"
  | "aneurysm"
  | "low-resistance"
  | "av-fistula"
  | "diabetic-angiopathy"
  | "flow-asymmetry"
  | "post-revascularization"
  | "normal";

export type LlaConclusionTemplate = {
  id: LlaConclusionTemplateId;
  number: number;
  label: string;
  template: string;
  category: "arterial" | "functional" | "postop" | "normal";
};

/** Маршрут сканирования §6.3 (Куликов: начинать с бедренных). */
export const LLA_SCANNING_ROUTE = [
  "Положение: лёжа, ноги слегка разведены; ПкА — на животе или согнутое колено 90–100°.",
  "Пах: ОБА → бифуркация ПБА/ГБА (продольное); давление достаточное для компрессии вен.",
  "ПБА до гунтерова канала; ГБА — проксимальный сегмент у бифуркации.",
  "ПкА P1–P3; деление на ПББА и тибиоперинеальный ствол.",
  "Голень: ЗББА (переднемедиальный доступ), ПББА (переднелатеральный), МБА.",
  "Подвздошные/аорта — конвекс 3–5 МГц при показаниях (тучность, нарушения на бедре).",
  "Диаметр — поперечное сечение; допплер — продольное.",
  "ЛПИ/ППИ — по протоколу клиники (норма ЛПИ 0,9–1,3).",
] as const;

/** §6.7 — табличный протокол. */
export const LLA_PROTOCOL_TABLE_SECTIONS = [
  {
    title: "Аорта",
    fields: ["Диаметр супра/инфраренально, мм"],
  },
  {
    title: "Аортоподвоздошный сегмент",
    fields: ["ОПА, НПА — PSV, RI, бляшки, % стеноза, окклюзия, характер кровотока"],
  },
  {
    title: "Бедренно-подколенный сегмент",
    fields: ["ОБА, ПБА, ГБА, ПкА — PSV, RI, бляшки, стеноз %, окклюзия"],
  },
  {
    title: "Берцовый сегмент",
    fields: ["ЗББА, ПББА, МБА — PSV, RI, бляшки, стеноз, окклюзия"],
  },
  {
    title: "Индексы и послеоперационно",
    fields: [
      "ЛПИ (R/L), ППИ при диабете/кальцинозе",
      "Протез/шунт: ход, анастомозы, parvus-tardus дистально",
    ],
  },
] as const;

/** §6.8 — 16 стандартов заключения. */
export const LLA_CONCLUSION_TEMPLATES: LlaConclusionTemplate[] = [
  {
    id: "small-plaques",
    number: 1,
    category: "arterial",
    label: "Множественные мелкие АСБ",
    template: "Множественные мелкие атеросклеротические бляшки {{location}} {{side}}.",
  },
  {
    id: "plaque",
    number: 2,
    category: "arterial",
    label: "АСБ",
    template: "Атеросклеротическая бляшка в {{location}} {{side}}.",
  },
  {
    id: "takayasu",
    number: 3,
    category: "arterial",
    label: "Аортоартериит",
    template: "Признаки неспецифического аортоартериита {{side}}.",
  },
  {
    id: "buerger",
    number: 4,
    category: "arterial",
    label: "Тромбангиит",
    template: "Признаки облитерирующего тромбангиита {{side}}.",
  },
  {
    id: "stenosis",
    number: 5,
    category: "arterial",
    label: "Стеноз",
    template:
      "Стеноз {{vessel}} {{percent}}% по диаметру {{side}} {{withLocalHemodynamics}} нарушением(-я) локальной гемодинамики.",
  },
  {
    id: "occlusion",
    number: 6,
    category: "arterial",
    label: "Окклюзия",
    template: "Окклюзия {{vessel}} {{side}}.",
  },
  {
    id: "abi-reduced",
    number: 7,
    category: "functional",
    label: "Снижение ЛПИ",
    template: "Снижение регионального давления в {{side}} н/к (ЛПИ {{abi}}).",
  },
  {
    id: "hypoplasia",
    number: 8,
    category: "arterial",
    label: "Гипоплазия",
    template: "Гипоплазия {{vessel}} {{side}}.",
  },
  {
    id: "diameter-asymmetry",
    number: 9,
    category: "arterial",
    label: "Асимметрия диаметров",
    template: "Асимметрия диаметров {{vessel}} с {{direction}} {{dominantSide}}.",
  },
  {
    id: "aneurysm",
    number: 10,
    category: "arterial",
    label: "Аневризма",
    template: "Аневризма {{vessel}} {{side}} ({{sizeMm}} мм).",
  },
  {
    id: "low-resistance",
    number: 11,
    category: "arterial",
    label: "Снижение сопротивления",
    template: "Снижение сосудистого сопротивления в бассейне {{vessel}} {{side}}.",
  },
  {
    id: "av-fistula",
    number: 12,
    category: "arterial",
    label: "АВ-соустье",
    template: "Признаки артериовенозного соустья {{location}} {{side}}.",
  },
  {
    id: "diabetic-angiopathy",
    number: 13,
    category: "functional",
    label: "Диабетическая ангиопатия",
    template:
      "Признаки диабетической ангиопатии {{side}}. Снижение регионального давления (ППИ {{abi}}).",
  },
  {
    id: "flow-asymmetry",
    number: 14,
    category: "functional",
    label: "Асимметрия кровотока",
    template: "Асимметрия кровотока с относительным снижением {{dominantSide}} на {{percent}}%.",
  },
  {
    id: "post-revascularization",
    number: 15,
    category: "postop",
    label: "После реконструкции",
    template:
      "Состояние после {{operation}} ({{year}}). {{graftStatus}}. ЛПИ {{abi}}.",
  },
  {
    id: "normal",
    number: 16,
    category: "normal",
    label: "Без патологии",
    template: "Признаков патологии артерий нижних конечностей не обнаружено.",
  },
];

export type LlaConclusionFill = Partial<{
  side: string;
  location: string;
  vessel: string;
  percent: string;
  withLocalHemodynamics: string;
  abi: string;
  direction: string;
  dominantSide: string;
  sizeMm: string;
  operation: string;
  year: string;
  graftStatus: string;
}>;

const SIDE_LABEL: Record<LlaSide, string> = {
  right: "справа",
  left: "слева",
  bilateral: "с обеих сторон",
};

export function sideLabelLla(side: LlaSide): string {
  return SIDE_LABEL[side];
}

export function applyLlaConclusionTemplate(
  templateId: LlaConclusionTemplateId,
  fill: LlaConclusionFill = {},
): string {
  const tpl = LLA_CONCLUSION_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return "";

  const defaults: LlaConclusionFill = {
    side: fill.side ?? "справа",
    location: fill.location ?? "бедренно-подколенного сегмента",
    vessel: fill.vessel ?? "общей бедренной артерии",
    percent: fill.percent ?? "—",
    withLocalHemodynamics: fill.withLocalHemodynamics ?? "с",
    abi: fill.abi ?? "—",
    direction: fill.direction ?? "уменьшением",
    dominantSide: fill.dominantSide ?? "слева",
    sizeMm: fill.sizeMm ?? "—",
    operation: fill.operation ?? "реконструктивной операции",
    year: fill.year ?? "—",
    graftStatus: fill.graftStatus ?? "Просвет шунта не изменён, анастомозы проходимы",
  };

  const merged = { ...defaults, ...fill };
  let text = tpl.template;
  for (const [key, value] of Object.entries(merged)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return text.replace(/\s+/g, " ").trim();
}

export function buildLlaConclusionDraft(
  items: { templateId: LlaConclusionTemplateId; fill?: LlaConclusionFill }[],
): string {
  const lines = items
    .map(({ templateId, fill }) => applyLlaConclusionTemplate(templateId, fill))
    .filter(Boolean);
  if (!lines.length) return "";
  return `${lines.join("\n")}\n\nЗаключение носит описательный характер; интерпретация — лечащим специалистом.`;
}
