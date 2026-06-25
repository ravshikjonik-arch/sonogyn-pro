/**
 * Протокол УЗД экстракраниальных БЦА — Куликов В.П., гл. 4 (2015).
 * §4.3 методика, §4.8 табличный протокол, §4.9 стандарты заключений.
 */

export type BcaSide = "right" | "left" | "bilateral";

export type BcaConclusionTemplateId =
  | "initial-atherosclerosis"
  | "takayasu"
  | "small-plaque"
  | "stable-plaque"
  | "unstable-plaque"
  | "calcified-plaque"
  | "kinking-c"
  | "kinking-s"
  | "coiling"
  | "tortuosity-wave"
  | "course-disruption"
  | "stenosis-morphologic"
  | "stenosis-doppler"
  | "bct-stenosis"
  | "subclavian-steal"
  | "subclavian-stenosis-distal"
  | "occlusion"
  | "bct-occlusion-steal"
  | "left-subclavian-occlusion"
  | "subclavian-occlusion-distal"
  | "va-hypoplasia"
  | "va-spasm"
  | "dissection"
  | "diameter-asymmetry"
  | "aneurysm"
  | "flow-asymmetry"
  | "venous-size-asymmetry"
  | "cerebral-venous-dys"
  | "ijv-thrombosis"
  | "vascular-anomaly"
  | "ophthalmic-collateral"
  | "normal";

export type BcaConclusionTemplate = {
  id: BcaConclusionTemplateId;
  number: number;
  label: string;
  /** Шаблон с заполнителями {{side}}, {{location}}, {{percent}}, {{method}} … */
  template: string;
  category: "arterial" | "venous" | "normal" | "deformation";
};

/** §4.3.1 — стандартные точки сканирования. */
export const BCA_SCANNING_POINTS = [
  "Диаметр ОСА и ВЯВ — поперечное сечение на уровне перстневидного хряща; компрессия ВЯВ.",
  "Допплер ОСА и ВЯВ — продольное сечение в месте измерения просвета.",
  "ТИМ ОСА — дистальный 1 см (проксимально от синуса), дальняя стенка, диастола.",
  "Диаметр ВСА — продольное сечение, участок с параллельными стенками дистальнее синуса.",
  "ПА и ПВ — C6–C7, исток ПА, V2/V3; ПВ — в костном канале на том же уровне.",
  "ПКА — дистальный участок, подключичный доступ; при патологии — проксимальные отделы и БЦС (надключичный доступ).",
  "При стенозе/окклюзии ВСА — допплер в месте поражения, проксимально и дистально; при показаниях — глазной анастомоз.",
  "При гемодинамически значимых поражениях ВСА/ОСА — PSV проксимального сегмента НСА.",
] as const;

/** §4.3.2 — функциональные пробы. */
export const BCA_FUNCTIONAL_TESTS = [
  {
    name: "Проба реактивной гиперемии (манжеточная)",
    indication: "Синдром подключично-позвоночного обкрадывания (стил-синдром).",
    technique:
      "Кровоток в ПА (V2/V4); манжета на предплечье поражённой стороны, давление >САД на 30–40 мм рт.ст., 1 мин, резкое стравливание.",
    interpretation:
      "Полный стил: усиление ретроградного потока. Переходный: реверсивный → ретроградный при пробе. Латентный: углубление среднесистолической выемки.",
  },
  {
    name: "Компрессия ветвей НСА",
    indication: "Стеноокклюзирующие поражения ВСА; функционирование глазного анастомоза.",
    technique:
      "Спектр из дистальной глазной/надблоковой артерии; кратковременное пережатие ветвей НСА (лицевая, височная, лобная, спинки носа).",
    interpretation:
      "При функционирующем анастомозе — резкое снижение/обнуление или смена направления на антеградный поток по глазной артерии.",
  },
  {
    name: "Проба с поколачиванием",
    indication: "Идентификация НСА при затруднённой дифференцировке от ВСА.",
    technique: "Поколачивание в проекции височной артерии.",
    interpretation: "Ритмичные колебания спектра в НСА, не в ВСА.",
  },
  {
    name: "Компрессионная проба ВЯВ",
    indication: "Подозрение на тромбоз яремной вены.",
    technique: "Поперечное сечение; полное спадение просвета при компрессии датчиком.",
    interpretation: "Неполная компрессия — признак тромбоза.",
  },
  {
    name: "Проба Вальсальвы",
    indication: "Недостаточность клапана ВЯВ; малая ВЯВ.",
    technique: "Спектр ВЯВ на уровне перстневидного хряща при натуживании.",
    interpretation: "Рефлюкс на клапане; малая ВЯВ не увеличивается при пробе.",
  },
  {
    name: "Проба с гиперкапнией (ПА)",
    indication: "Дифференциация гипоплазии и спазма ПА.",
    technique: "Диаметр и PSV ПА на V2 до/после гиперкапнии.",
    interpretation: "При спазме — увеличение диаметра >0,2 мм и изменение спектра; при гипоплазии — без реакции.",
  },
] as const;

/** §4.8 — поля табличного протокола (блоки). */
export const BCA_PROTOCOL_TABLE_SECTIONS = [
  {
    title: "АД и общие показатели",
    fields: ["АД справа/слева, мм рт.ст.", "Асимметрия АД на руках (>15 мм — стил-синдром)"],
  },
  {
    title: "ОСА / ВСА / ПА (справа и слева)",
    fields: [
      "ТИМ, мм",
      "Атеросклеротические бляшки: эхогенность, кальциноз/кровоизлияние/изъязвление, толщина × протяжённость",
      "Локализация: исток, прокс./сред./дист. треть, синус",
      "% стеноза: по диаметру (попер./продол.), ECST, NASCET, по гемодинамике",
      "Деформации: форма, локализация, дезорганизация кровотока (+/−)",
      "Vps прокс./ангул./дист.; прирост Vps, %",
    ],
  },
  {
    title: "Гемодинамика (при патологии)",
    fields: [
      "ОСА, ВСА, ПА, ПКА — Vps, TAMX, RI, диаметр",
      "Характер кровотока: магистральный / дезорганизованный / турбулентный / коллатеральный / ретроградный / реверсивный",
      "КА — коэффициент асимметрии",
    ],
  },
  {
    title: "Венозная система",
    fields: [
      "ВЯВ, ПВ — D/d, Vmax",
      "Флебэктазия, малая ВЯВ, рефлюкс, компрессия, тромбоз",
    ],
  },
  {
    title: "Дополнительно",
    fields: [
      "Глазной анастомоз: направление, коллатеральное заполнение",
      "НСА при показаниях",
      "Метод измерения стеноза (обязательно указать ECST/NASCET)",
    ],
  },
] as const;

/** §4.9 — 33 стандартных формулировки заключения. */
export const BCA_CONCLUSION_TEMPLATES: BcaConclusionTemplate[] = [
  {
    id: "initial-atherosclerosis",
    number: 1,
    category: "arterial",
    label: "Начальный атеросклероз (увеличение ТИМ)",
    template:
      "Признаки начального атеросклероза в виде увеличения ТИМ ОСА {{side}} до {{imtMm}} мм.",
  },
  {
    id: "takayasu",
    number: 2,
    category: "arterial",
    label: "Неспецифический аортоартериит",
    template:
      "Признаки неспецифического аортоартериита: диффузное утолщение стенки {{vessel}} до {{wallMm}} мм, {{stenosisOrOcclusion}} {{side}}.",
  },
  {
    id: "small-plaque",
    number: 3,
    category: "arterial",
    label: "Мелкая(ие) АСБ",
    template: "Мелкая (множественные мелкие) атеросклеротическая (-ие) бляшка (-и) {{location}} {{side}}.",
  },
  {
    id: "stable-plaque",
    number: 4,
    category: "arterial",
    label: "Стабильная АСБ",
    template: "Стабильная (гомогенная гиперэхогенная) атеросклеротическая бляшка в {{location}} {{side}}.",
  },
  {
    id: "unstable-plaque",
    number: 5,
    category: "arterial",
    label: "Нестабильная АСБ",
    template:
      "Нестабильная ({{echogenicity}}) атеросклеротическая бляшка{{complications}} в {{location}} {{side}}.",
  },
  {
    id: "calcified-plaque",
    number: 6,
    category: "arterial",
    label: "Кальцинированная АСБ",
    template: "Кальцинированная атеросклеротическая бляшка в {{location}} {{side}}.",
  },
  {
    id: "kinking-c",
    number: 7,
    category: "deformation",
    label: "С-извитость с нарушением гемодинамики",
    template:
      "С-образная извитость/деформация (перегиб) {{side}} с острым углом и нарушением локальной гемодинамики.",
  },
  {
    id: "kinking-s",
    number: 8,
    category: "deformation",
    label: "S-извитость с нарушением гемодинамики",
    template:
      "S-образная извитость/деформация {{side}} с острыми углами и нарушением локальной гемодинамики.",
  },
  {
    id: "coiling",
    number: 9,
    category: "deformation",
    label: "Петлеобразная извитость",
    template:
      "Петлеобразная извитость {{side}} {{withLocalHemodynamics}} нарушением(-я) локальной гемодинамики.",
  },
  {
    id: "tortuosity-wave",
    number: 10,
    category: "deformation",
    label: "Волнообразная извитость",
    template:
      "Волнообразная извитость {{side}} с тупыми углами без нарушений локальной гемодинамики.",
  },
  {
    id: "course-disruption",
    number: 12,
    category: "deformation",
    label: "Нарушение хода",
    template: "Нарушение хода {{vessel}} {{side}}.",
  },
  {
    id: "stenosis-morphologic",
    number: 13,
    category: "arterial",
    label: "Стеноз (планиметрия)",
    template:
      "Стеноз {{vessel}} {{percent}}% ({{method}}) {{side}} {{withLocalHemodynamics}} нарушений локальной гемодинамики.",
  },
  {
    id: "stenosis-doppler",
    number: 14,
    category: "arterial",
    label: "Стеноз по гемодинамике",
    template: "Стеноз {{vessel}} {{percentRange}} по гемодинамике {{side}} (планиметрия невозможна).",
  },
  {
    id: "bct-stenosis",
    number: 15,
    category: "arterial",
    label: "Стеноз БЦС",
    template: "Стеноз брахиоцефального ствола {{side}}.",
  },
  {
    id: "subclavian-steal",
    number: 16,
    category: "arterial",
    label: "Стеноз I сегмента ПКА / стил-синдром",
    template: "Стеноз I сегмента подключичной артерии {{side}}. {{stealType}} стил-синдром.",
  },
  {
    id: "subclavian-stenosis-distal",
    number: 17,
    category: "arterial",
    label: "Стеноз II–III сегмента ПКА",
    template: "Стеноз II–III сегмента подключичной артерии {{side}}.",
  },
  {
    id: "occlusion",
    number: 18,
    category: "arterial",
    label: "Окклюзия",
    template: "Окклюзия {{vessel}} {{side}}.",
  },
  {
    id: "bct-occlusion-steal",
    number: 19,
    category: "arterial",
    label: "Окклюзия БЦС + стил",
    template:
      "Окклюзия брахиоцефального ствола {{side}}. Стил-синдром с {{stealVariant}}.",
  },
  {
    id: "left-subclavian-occlusion",
    number: 20,
    category: "arterial",
    label: "Окклюзия I сегмента левой ПКА",
    template: "Окклюзия I сегмента левой подключичной артерии. Полный стил-синдром.",
  },
  {
    id: "subclavian-occlusion-distal",
    number: 21,
    category: "arterial",
    label: "Окклюзия II–III сегмента ПКА",
    template: "Окклюзия II–III сегмента подключичной артерии {{side}}.",
  },
  {
    id: "va-hypoplasia",
    number: 22,
    category: "arterial",
    label: "Гипоплазия ПА",
    template: "Гипоплазия позвоночной артерии {{side}} (диаметр {{diameterMm}} мм).",
  },
  {
    id: "va-spasm",
    number: 23,
    category: "arterial",
    label: "Спазм ПА",
    template: "Признаки спазма позвоночной артерии {{side}}.",
  },
  {
    id: "dissection",
    number: 24,
    category: "arterial",
    label: "Диссекция",
    template: "Признаки диссекции {{vessel}} {{side}}: {{manifestation}}.",
  },
  {
    id: "diameter-asymmetry",
    number: 25,
    category: "arterial",
    label: "Асимметрия диаметров",
    template: "Асимметрия диаметров {{vessel}} с {{direction}} {{dominantSide}}.",
  },
  {
    id: "aneurysm",
    number: 26,
    category: "arterial",
    label: "Аневризма",
    template: "Аневризма {{vessel}} {{side}} ({{sizeMm}} мм).",
  },
  {
    id: "flow-asymmetry",
    number: 27,
    category: "arterial",
    label: "Асимметрия кровотока",
    template: "Асимметрия кровотока с {{direction}} {{dominantSide}}.",
  },
  {
    id: "venous-size-asymmetry",
    number: 28,
    category: "venous",
    label: "Асимметрия ВЯВ/ПВ",
    template: "Асимметрия размеров {{vein}} с {{direction}} {{dominantSide}}.",
  },
  {
    id: "cerebral-venous-dys",
    number: 29,
    category: "venous",
    label: "Церебральная венозная дисциркуляция",
    template:
      "Признаки церебральной венозной дисциркуляции с нарушением оттока по {{veinPath}} {{side}}: {{criteria}}.",
  },
  {
    id: "ijv-thrombosis",
    number: 30,
    category: "venous",
    label: "Тромбоз ВЯВ",
    template: "Тромбоз внутренней яремной вены {{side}}.",
  },
  {
    id: "vascular-anomaly",
    number: 31,
    category: "arterial",
    label: "Аномалия отхождения/впадения",
    template: "Аномалия {{anomalyType}} {{vessel}} ({{details}}).",
  },
  {
    id: "ophthalmic-collateral",
    number: 32,
    category: "arterial",
    label: "Глазной анастомоз",
    template:
      "Асимметрия кровотока/ретроградный кровоток по глазной артерии {{side}}; {{collateralNote}}.",
  },
  {
    id: "normal",
    number: 33,
    category: "normal",
    label: "Без патологии",
    template: "Признаков патологии экстракраниальных брахиоцефальных сосудов не обнаружено.",
  },
];

export type BcaConclusionFill = Partial<{
  side: string;
  location: string;
  imtMm: string;
  vessel: string;
  wallMm: string;
  stenosisOrOcclusion: string;
  echogenicity: string;
  complications: string;
  withLocalHemodynamics: string;
  percent: string;
  percentRange: string;
  method: string;
  stealType: string;
  stealVariant: string;
  diameterMm: string;
  manifestation: string;
  direction: string;
  dominantSide: string;
  sizeMm: string;
  vein: string;
  veinPath: string;
  criteria: string;
  anomalyType: string;
  details: string;
  collateralNote: string;
}>;

const SIDE_LABEL: Record<BcaSide, string> = {
  right: "справа",
  left: "слева",
  bilateral: "с обеих сторон",
};

export function applyBcaConclusionTemplate(
  templateId: BcaConclusionTemplateId,
  fill: BcaConclusionFill = {},
): string {
  const tpl = BCA_CONCLUSION_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return "";

  const defaults: BcaConclusionFill = {
    side: fill.side ?? "справа",
    location: fill.location ?? "в области бифуркации",
    imtMm: fill.imtMm ?? "1,2",
    vessel: fill.vessel ?? "внутренней сонной артерии",
    wallMm: fill.wallMm ?? "—",
    stenosisOrOcclusion: fill.stenosisOrOcclusion ?? "стеноз",
    echogenicity: fill.echogenicity ?? "гетерогенная, преимущественно гипоэхогенная",
    complications: fill.complications ?? "",
    withLocalHemodynamics: fill.withLocalHemodynamics ?? "с",
    percent: fill.percent ?? "—",
    percentRange: fill.percentRange ?? "50–69%",
    method: fill.method ?? "ECST, поперечное сечение",
    stealType: fill.stealType ?? "переходный",
    stealVariant: fill.stealVariant ?? "сонно-подключичным обкрадыванием",
    diameterMm: fill.diameterMm ?? "1,7",
    manifestation: fill.manifestation ?? "стеноз",
    direction: fill.direction ?? "уменьшением",
    dominantSide: fill.dominantSide ?? "слева",
    sizeMm: fill.sizeMm ?? "—",
    vein: fill.vein ?? "внутренней яремной вены",
    veinPath: fill.veinPath ?? "ВЯВ",
    criteria: fill.criteria ?? "флебэктазия ВЯВ",
    anomalyType: fill.anomalyType ?? "высокого впадения",
    details: fill.details ?? "—",
    collateralNote: fill.collateralNote ?? "коллатеральное заполнение через глазной анастомоз",
  };

  const merged = { ...defaults, ...fill };
  let text = tpl.template;
  for (const [key, value] of Object.entries(merged)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return text.replace(/\s+/g, " ").trim();
}

export function sideLabel(side: BcaSide): string {
  return SIDE_LABEL[side];
}

/** Сборка многострочного заключения из выбранных пунктов. */
export function buildBcaConclusionDraft(
  items: { templateId: BcaConclusionTemplateId; fill?: BcaConclusionFill }[],
): string {
  const lines = items
    .map(({ templateId, fill }) => applyBcaConclusionTemplate(templateId, fill))
    .filter(Boolean);
  if (!lines.length) return "";
  return `${lines.join("\n")}\n\nЗаключение носит описательный характер; интерпретация — лечащим специалистом.`;
}
