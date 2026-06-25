/**
 * TCD / транскраниальное УЗД — Куликов В.П., гл. 5 (2015).
 * §5.3 методика, §5.8 протокол, §5.9 стандарты заключений.
 */

export type TcdSide = "right" | "left" | "bilateral";

export type TcdConclusionTemplateId =
  | "stenosis"
  | "occlusion"
  | "avm"
  | "aneurysm"
  | "flow-asymmetry"
  | "collateral-reserve"
  | "collateral-stage"
  | "cvr-co2"
  | "intracranial-steal"
  | "resistance-change"
  | "acom-function"
  | "pcom-function"
  | "fetal-pca"
  | "collateral-pathway"
  | "va-compression"
  | "va-spasm"
  | "venous-dys"
  | "sinus-thrombosis"
  | "normal";

export type TcdConclusionTemplate = {
  id: TcdConclusionTemplateId;
  number: number;
  label: string;
  template: string;
  category: "arterial" | "functional" | "venous" | "normal";
};

/** §5.3.1 — окна и идентификация артерий. */
export const TCD_SCANNING_WINDOWS = [
  {
    window: "Транстemporal",
    arteries: [
      "СМА (M1): к датчику, глубина 40–60 мм (типично 50–55 мм)",
      "ПМА (A1): от датчика, 60–75 мм",
      "ЗМА (P1/P2): к/от датчика, 65–75 мм",
      "ПКоА, ЗКоА — при дуплексе (рис. 5.11)",
      "Intracranial ICA (сифон): аксиальное сечение через мост",
      "Базальная вена Розенталя — снижение PRF для вен",
    ],
  },
  {
    window: "Трансокципитальный",
    arteries: [
      "V4 ПА + основная артерия (U-образная фигура, поток от датчика)",
      "ЗИМА, ПНМА — при детальном исследовании",
    ],
  },
  {
    window: "Трансорбитальный",
    arteries: ["Глазная артерия — оценка коллатералей / ретроградного потока"],
  },
  {
    window: "Субмандибулярный",
    arteries: ["Дистальный сегмент экстра-/интракраниальной ВСА"],
  },
] as const;

/** §5.3.2 — функциональные пробы (по показаниям). */
export const TCD_FUNCTIONAL_TESTS = [
  {
    name: "Компрессия ОСА",
    indication: "Коллатеральный резерв, ПКоА/ЗКоА, ауторегуляция (тест Гилера).",
    technique: "Кратко (3–5 циклов), без ротации головы; 3 пальца вдоль ОСА проксимально.",
    interpretation:
      "Падение TAMX СМА <50% — достаточный резерв; 50–80% — сниженный; >80% или TAMX <20 см/с — декомпенсация. ПКоА: рост PSV контралат. ПМА ≥20 см/с (+20%) или ретроград ипсилат. ПМА. КО после декомпрессии <1 — нарушение ауторегуляции.",
  },
  {
    name: "Проба с гипер-/гипокапнией",
    indication: "ЦВРСО₂; дифференциация спазма/гипоплазии ПА; венозная реактивность.",
    technique: "Возвратное дыхание через ДОМП («Карбоник») + капнография PetCO₂; гипокапния PetCO₂ 20–25 мм рт.ст.",
    interpretation: "VR, CR индексы; прирост PetCO₂ ≤11 мм рт.ст. для корректной оценки. Венозная реактивность базальной вены на гиперкапнию >40–60%.",
  },
  {
    name: "Поворотная проба (ПА)",
    indication: "Экстравазальное сдавление ПА (остеохондроз, мышцы).",
    technique: "PSV/TAMX ПА в покое и при повороте головы вправо/влево.",
    interpretation: "Снижение скорости >20% — признак компрессии.",
  },
  {
    name: "Осцилляционный тест",
    indication: "Окклюзия ВСА/ПА; роль глазного анастомоза.",
    technique: "Поколачивание по проекции ВСА (подчелюстно) или V3 ПА.",
    interpretation: "Отсутствие осцилляций в СМА — окклюзия/выраженный стеноз ВСА.",
  },
  {
    name: "«Пузырьковый» тест",
    indication: "Парадоксальная эмболия, открытое овальное окно.",
    technique: "Мониторинг СМА; IV агitated saline + Valsalva; ≥1 МЭС — положительно.",
    interpretation: "≥10 МЭС — выраженный функционирующий шунт.",
  },
  {
    name: "Ортостатическая проба (вены)",
    indication: "Внутричерепная гипертензия, венозная дисциркуляция.",
    technique: "Vmax в базальной вене/прямом sinus: лёжа → сидя через 1 мин.",
    interpretation: "Снижение >30% — признак ВЧ гипертензии.",
  },
] as const;

/** §5.8 — поля протокола TCD. */
export const TCD_PROTOCOL_TABLE_SECTIONS = [
  {
    title: "Скорости артерий (справа/слева)",
    fields: ["СМА, ПМА, ЗМА, ПА, ОА — Vps, TAMX, RI", "КА — коэффициент асимметрии", "Характер кровотока"],
  },
  {
    title: "Вены",
    fields: ["Базальные вены Vmax, фазность", "Синусы — по показаниям"],
  },
  {
    title: "Функциональные пробы",
    fields: [
      "Исход / гиперкапния / компрессия ипси-ОСА",
      "Индекс Линдегарда (Vps СМА / Vps ВСА)",
      "Функционирование ПКоА / ЗКоА",
      "Поворотная проба ПА",
    ],
  },
] as const;

/** §5.9 — 19 стандартов заключения. */
export const TCD_CONCLUSION_TEMPLATES: TcdConclusionTemplate[] = [
  { id: "stenosis", number: 1, category: "arterial", label: "Стеноз", template: "Стеноз {{vessel}} {{side}} {{percentRange}}." },
  { id: "occlusion", number: 2, category: "arterial", label: "Окклюзия", template: "Окклюзия {{vessel}} {{side}}." },
  { id: "avm", number: 3, category: "arterial", label: "АВМ", template: "Признаки артериовенозной мальформации в бассейне {{basin}} {{side}}." },
  { id: "aneurysm", number: 4, category: "arterial", label: "Аневризма", template: "Признаки аневризмы {{location}} {{side}}." },
  {
    id: "flow-asymmetry",
    number: 5,
    category: "arterial",
    label: "Асимметрия кровотока",
    template: "Асимметрия кровотока со снижением {{dominantSide}}.",
  },
  {
    id: "collateral-reserve",
    number: 6,
    category: "functional",
    label: "Коллатеральный резерв",
    template: "{{collateralReserve}} коллатеральный резерв мозгового кровообращения {{side}}.",
  },
  {
    id: "collateral-stage",
    number: 7,
    category: "functional",
    label: "Стадия коллатералей",
    template: "{{collateralStage}} коллатерального кровообращения {{side}}.",
  },
  {
    id: "cvr-co2",
    number: 8,
    category: "functional",
    label: "ЦВРСО₂",
    template:
      "{{cvrStatus}} цереброваскулярная реактивность на CO₂ (VRhyper {{vrHyper}}, CR {{cr}}) {{side}}.",
  },
  {
    id: "intracranial-steal",
    number: 9,
    category: "functional",
    label: "Внутримозговое обкрадывание",
    template: "Признаки внутримозгового обкрадывания в бассейне {{side}} СМА.",
  },
  {
    id: "resistance-change",
    number: 10,
    category: "functional",
    label: "Сосудистое сопротивление",
    template: "{{resistanceChange}} сосудистого сопротивления в бассейне {{basin}} {{side}}.",
  },
  {
    id: "acom-function",
    number: 11,
    category: "functional",
    label: "ПКоА",
    template: "{{acomStatus}} о функционировании передней коммуникантной артерии.",
  },
  {
    id: "pcom-function",
    number: 12,
    category: "functional",
    label: "ЗКоА",
    template: "{{pcomStatus}} о функционировании задней коммуникантной артерии.",
  },
  {
    id: "fetal-pca",
    number: 13,
    category: "arterial",
    label: "Фетальное строение ЗМА",
    template: "Признаки фетального строения задней мозговой артерии {{side}}.",
  },
  {
    id: "collateral-pathway",
    number: 14,
    category: "functional",
    label: "Коллатеральный путь",
    template: "Активация коллатерального кровотока по {{pathway}} {{side}}.",
  },
  {
    id: "va-compression",
    number: 15,
    category: "functional",
    label: "Экстравазальное сдавление ПА",
    template: "Признаки экстравазального воздействия на позвоночную артерию при поворотах головы {{rotationSide}}.",
  },
  {
    id: "va-spasm",
    number: 16,
    category: "arterial",
    label: "Спазм ПА",
    template: "Признаки спазма {{side}} позвоночной артерии.",
  },
  {
    id: "venous-dys",
    number: 17,
    category: "venous",
    label: "Венозная дисциркуляция",
    template:
      "Признаки церебральной венозной дисциркуляции: {{venousCriteria}} {{side}}.",
  },
  {
    id: "sinus-thrombosis",
    number: 18,
    category: "venous",
    label: "Тромбоз синусов",
    template: "Нельзя исключить тромбоз венозных синусов {{side}}.",
  },
  {
    id: "normal",
    number: 19,
    category: "normal",
    label: "Без патологии",
    template: "Признаков патологии при транскраниальном исследовании не обнаружено.",
  },
];

export type TcdConclusionFill = Partial<{
  side: string;
  vessel: string;
  percentRange: string;
  basin: string;
  location: string;
  dominantSide: string;
  collateralReserve: string;
  collateralStage: string;
  cvrStatus: string;
  vrHyper: string;
  cr: string;
  resistanceChange: string;
  acomStatus: string;
  pcomStatus: string;
  pathway: string;
  rotationSide: string;
  venousCriteria: string;
}>;

const SIDE_LABEL: Record<TcdSide, string> = {
  right: "справа",
  left: "слева",
  bilateral: "с обеих сторон",
};

export function sideLabelTcd(side: TcdSide): string {
  return SIDE_LABEL[side];
}

export function applyTcdConclusionTemplate(
  templateId: TcdConclusionTemplateId,
  fill: TcdConclusionFill = {},
): string {
  const tpl = TCD_CONCLUSION_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return "";

  const defaults: TcdConclusionFill = {
    side: fill.side ?? "справа",
    vessel: fill.vessel ?? "средней мозговой артерии",
    percentRange: fill.percentRange ?? ">50%",
    basin: fill.basin ?? "передней циркуляции",
    location: fill.location ?? "сифона ВСА",
    dominantSide: fill.dominantSide ?? "слева",
    collateralReserve: fill.collateralReserve ?? "Достаточный",
    collateralStage: fill.collateralStage ?? "Стадия компенсации",
    cvrStatus: fill.cvrStatus ?? "Нормальная",
    vrHyper: fill.vrHyper ?? "—",
    cr: fill.cr ?? "—",
    resistanceChange: fill.resistanceChange ?? "Увеличение",
    acomStatus: fill.acomStatus ?? "ПКоА функционирует",
    pcomStatus: fill.pcomStatus ?? "ЗКоА функционирует",
    pathway: fill.pathway ?? "ПКоА",
    rotationSide: fill.rotationSide ?? "вправо/влево",
    venousCriteria: fill.venousCriteria ?? "снижение реактивности базальной вены на гиперкапнию",
  };

  const merged = { ...defaults, ...fill };
  let text = tpl.template;
  for (const [key, value] of Object.entries(merged)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return text.replace(/\s+/g, " ").trim();
}

export function buildTcdConclusionDraft(
  items: { templateId: TcdConclusionTemplateId; fill?: TcdConclusionFill }[],
): string {
  const lines = items
    .map(({ templateId, fill }) => applyTcdConclusionTemplate(templateId, fill))
    .filter(Boolean);
  if (!lines.length) return "";
  return `${lines.join("\n")}\n\nЗаключение носит описательный характер; интерпретация — лечащим специалистом.`;
}
