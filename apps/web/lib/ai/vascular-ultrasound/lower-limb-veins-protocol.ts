/**
 * Вены нижних конечностей — Куликов В.П., гл. 7 (2015).
 * §7.3 методика, §7.8 протокол, §7.9 стандарты заключений.
 */

export type LlvSide = "right" | "left" | "bilateral";

export type LlvConclusionTemplateId =
  | "dvt-occluding"
  | "dvt-non-occluding"
  | "post-thrombotic"
  | "prior-thrombosis"
  | "ivc-filter-typical"
  | "ivc-filter-displacement"
  | "ivc-thrombosis-filter"
  | "ivc-thrombosis-spread"
  | "ivc-thrombosis-distal"
  | "varicose"
  | "reflux"
  | "av-malformation"
  | "hypoplasia-aplasia"
  | "angiomatosis"
  | "perforator"
  | "normal";

export type LlvConclusionTemplate = {
  id: LlvConclusionTemplateId;
  number: number;
  label: string;
  template: string;
  category: "thrombosis" | "reflux" | "structural" | "ivc-filter" | "normal";
};

/** §7.3.1 — маршрут и точки сканирования. */
export const LLV_SCANNING_ROUTE = [
  "Положение: лёжа — ТГВ/ПТБ; стоя — варикоз и рефлюкс (обязательно вертикально).",
  "НПВ → подвздошные вены (при показаниях) → ОБВ → ПБВ → ГБВ → ПкВ.",
  "Подкожные: БПВ (сафено-femoral junction, GSV trunk), МПВ (sapheno-popliteal).",
  "Перфоранты: диаметр, направление потока, рефлюкс при компрессии.",
  "Берцовые: ЗББВ, ПББВ, МБВ — компрессия + спектр при подозрении на тромб.",
  "Острая фаза: non-compressibility + отсутствие/фрагментарный поток.",
  "Хроническая фаза: реканализация, синехии, частичная компрессия.",
  "Кава-фильтр: положение, турбулентность, тромб в области фильтра.",
] as const;

/** §7.3.2 — функциональные пробы. */
export const LLV_FUNCTIONAL_TESTS = [
  "Вальсальва — БПВ/МПВ, подкожные вены (стоя).",
  "Дистальная компрессия — глубокие вены бедра/голени, ПкВ.",
  "Пальцевой тест / переступание — перфоранты в вертикали.",
  "Переход лёжа → стоя — оценка рефлюкса и диаметра.",
] as const;

/** §7.8 — структура табличного протокола. */
export const LLV_PROTOCOL_TABLE_SECTIONS = [
  {
    title: "НПВ и подвздошный сегмент",
    fields: ["Проходимость", "Компрессия", "Кава-фильтр (при наличии)"],
  },
  {
    title: "Глубокие вены",
    fields: [
      "ОБВ, ПБВ, ГБВ, ПкВ — компрессия, эхогенность тромба, флотация",
      "Берцовые — ЗББВ, ПББВ, МБВ",
    ],
  },
  {
    title: "Подкожные вены",
    fields: ["БПВ/МПВ — диаметр, флебэктазия, рефлюкс (длительность, Vmax)"],
  },
  {
    title: "Перфоранты",
    fields: ["Диаметр ≤3,5 мм в норме", "Антеградный/ретроградный поток", "Рефлюкс при компрессии"],
  },
  {
    title: "Функциональные пробы",
    fields: [
      "Вальсальва / дистальная компрессия",
      "Сегмент рефлюкса (верх/ср/ниж треть)",
      "Hach I–IV / локальный рефлюкс",
    ],
  },
] as const;

/** §7.9 — 15 стандартов заключения. */
export const LLV_CONCLUSION_TEMPLATES: LlvConclusionTemplate[] = [
  {
    id: "dvt-occluding",
    number: 1,
    category: "thrombosis",
    label: "Окклюзирующий тромбоз",
    template:
      "Признаки окклюзирующего тромбоза вен {{segment}} сегмента {{side}}. Флотирующий тромб в {{vessel}} протяженностью {{lengthCm}} см.",
  },
  {
    id: "dvt-non-occluding",
    number: 1,
    category: "thrombosis",
    label: "Неокклюзирующий тромбоз",
    template:
      "Признаки неокклюзирующего тромбоза вен {{segment}} сегмента {{side}}. Проксимальная граница на уровне {{level}}.",
  },
  {
    id: "post-thrombotic",
    number: 2,
    category: "thrombosis",
    label: "Посттромботический синдром",
    template:
      "Признаки посттромботического синдрома вен {{segment}} сегмента {{side}}, реканализация {{recanalization}}.",
  },
  {
    id: "prior-thrombosis",
    number: 3,
    category: "thrombosis",
    label: "Перенесённый тромбоз БПВ/МПВ",
    template: "Признаки перенесённого тромбоза {{vessel}} {{side}} на уровне {{level}}.",
  },
  {
    id: "ivc-filter-typical",
    number: 4,
    category: "ivc-filter",
    label: "Кава-фильтр — типичное положение",
    template: "Состояние после имплантации кава-фильтра. Типичное положение на уровне почечных вен.",
  },
  {
    id: "ivc-filter-displacement",
    number: 5,
    category: "ivc-filter",
    label: "Дислокация кава-фильтра",
    template:
      "Состояние после имплантации кава-фильтра. Дислокация фильтра в {{direction}} отдел нижней полой вены.",
  },
  {
    id: "ivc-thrombosis-filter",
    number: 6,
    category: "ivc-filter",
    label: "Тромбоз НПВ у фильтра",
    template: "Признаки тромбоза нижней полой вены в области кава-фильтра.",
  },
  {
    id: "ivc-thrombosis-spread",
    number: 7,
    category: "ivc-filter",
    label: "Тромбоз НПВ с распространением",
    template:
      "Признаки тромбоза нижней полой вены в области кава-фильтра с распространением тромботических масс на {{lengthCm}} см выше фильтра.",
  },
  {
    id: "ivc-thrombosis-distal",
    number: 8,
    category: "ivc-filter",
    label: "Тромбоз НПВ дистальнее фильтра",
    template: "Признаки тромбоза нижней полой вены на уровне и дистальнее кава-фильтра.",
  },
  {
    id: "varicose",
    number: 9,
    category: "reflux",
    label: "Варикозная деформация",
    template: "Варикозная деформация подкожных вен бассейна {{basin}} {{side}}: {{location}}.",
  },
  {
    id: "reflux",
    number: 10,
    category: "reflux",
    label: "Венозный рефлюкс",
    template:
      "Венозный рефлюкс {{side}}: {{vessel}}, продолжительность {{durationSec}} с, начальная скорость {{velocityCmS}} см/с, {{extent}}.",
  },
  {
    id: "av-malformation",
    number: 11,
    category: "structural",
    label: "АВ-соустье / мальформация",
    template: "Артериовенозное соустье (мальформация) {{location}} {{side}}.",
  },
  {
    id: "hypoplasia-aplasia",
    number: 12,
    category: "structural",
    label: "Гипоплазия / аплазия",
    template: "Гипоплазия {{vesselHypo}}. Аплазия {{vesselApla}}. Флебэктазия {{phlebectasiaLocation}}.",
  },
  {
    id: "angiomatosis",
    number: 13,
    category: "structural",
    label: "Ангиоматоз",
    template: "Признаки ангиоматоза мягких тканей {{location}} {{side}}.",
  },
  {
    id: "perforator",
    number: 14,
    category: "reflux",
    label: "Перфорантная вена",
    template:
      "Флебэктазия перфорантной вены {{perforatorName}}, диаметр {{diameterMm}} мм, кровоток {{flowDirection}}.",
  },
  {
    id: "normal",
    number: 15,
    category: "normal",
    label: "Без патологии",
    template: "Признаков патологии вен нижних конечностей не обнаружено.",
  },
];

export type LlvConclusionFill = Partial<{
  side: string;
  segment: string;
  vessel: string;
  lengthCm: string;
  level: string;
  recanalization: string;
  direction: string;
  basin: string;
  location: string;
  durationSec: string;
  velocityCmS: string;
  extent: string;
  perforatorName: string;
  diameterMm: string;
  flowDirection: string;
  vesselHypo: string;
  vesselApla: string;
  phlebectasiaLocation: string;
}>;

const SIDE_LABEL: Record<LlvSide, string> = {
  right: "справа",
  left: "слева",
  bilateral: "с обеих сторон",
};

export function sideLabelLlv(side: LlvSide): string {
  return SIDE_LABEL[side];
}

export function applyLlvConclusionTemplate(
  templateId: LlvConclusionTemplateId,
  fill: LlvConclusionFill = {},
): string {
  const tpl = LLV_CONCLUSION_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return "";

  const defaults: LlvConclusionFill = {
    side: fill.side ?? "справа",
    segment: fill.segment ?? "бедренно-подколенно-берцового",
    vessel: fill.vessel ?? "общей бедренной вены",
    lengthCm: fill.lengthCm ?? "—",
    level: fill.level ?? "средней трети бедра",
    recanalization: fill.recanalization ?? "неполная",
    direction: fill.direction ?? "дистальный",
    basin: fill.basin ?? "БПВ",
    location: fill.location ?? "проксимальной трети бедра",
    durationSec: fill.durationSec ?? "—",
    velocityCmS: fill.velocityCmS ?? "—",
    extent: fill.extent ?? "на протяжении бедра (Hach II)",
    perforatorName: fill.perforatorName ?? "Кокетта",
    diameterMm: fill.diameterMm ?? "—",
    flowDirection: fill.flowDirection ?? "ретроградный",
    vesselHypo: fill.vesselHypo ?? "—",
    vesselApla: fill.vesselApla ?? "—",
    phlebectasiaLocation: fill.phlebectasiaLocation ?? "—",
  };

  const merged = { ...defaults, ...fill };
  let text = tpl.template;
  for (const [key, value] of Object.entries(merged)) {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value ?? "");
  }
  return text.replace(/\s+/g, " ").trim();
}

export function buildLlvConclusionDraft(
  items: { templateId: LlvConclusionTemplateId; fill?: LlvConclusionFill }[],
): string {
  const lines = items
    .map(({ templateId, fill }) => applyLlvConclusionTemplate(templateId, fill))
    .filter(Boolean);
  if (!lines.length) return "";
  return `${lines.join("\n")}\n\nЗаключение носит описательный характер; интерпретация — лечащим специалистом.`;
}
