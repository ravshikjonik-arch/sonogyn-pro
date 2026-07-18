import {
  buildProtocolOneLiner,
  buildReportText,
  calculateORADS,
  type BloodFlow,
  type Menopause,
  type OradsInput,
  type Structure,
  type UnilocularSubtype,
} from "@/lib/orads-pro";

export type OradsTextFinding = {
  label: string;
  value: string;
  confidence: "high" | "medium" | "low";
};

export type OradsTextParseResult = {
  input: OradsInput;
  findings: OradsTextFinding[];
  warnings: string[];
  protocolLine: string;
  reportText: string;
};

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function hasNegated(text: string, terms: string[]) {
  return terms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:без|нет|не определяется|не выявлено|отсутствует)\\s+[^.]{0,40}${escaped}`, "i").test(text);
  });
}

function firstNumber(text: string, patterns: RegExp[]): number | undefined {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const raw = match?.[1]?.replace(",", ".");
    const value = raw ? Number(raw) : NaN;
    if (Number.isFinite(value) && value > 0) return value;
  }
  return undefined;
}

function parseDimensions(text: string): Pick<OradsInput, "lengthMm" | "widthMm" | "heightMm"> {
  const normalized = text.replace(/,/g, ".");
  const triplet = normalized.match(/(\d+(?:\.\d+)?)\s*[xх*×]\s*(\d+(?:\.\d+)?)\s*[xх*×]\s*(\d+(?:\.\d+)?)(?:\s*(мм|mm|см|cm))?/i);
  if (triplet) {
    const unit = triplet[4]?.toLowerCase();
    const factor = unit === "см" || unit === "cm" ? 10 : 1;
    return {
      lengthMm: Number(triplet[1]) * factor,
      widthMm: Number(triplet[2]) * factor,
      heightMm: Number(triplet[3]) * factor,
    };
  }

  const largestCm = firstNumber(normalized, [
    /(?:до|размер(?:ом|ы)?|диаметр(?:ом)?|d)\s*(\d+(?:\.\d+)?)\s*(?:см|cm)/i,
  ]);
  if (largestCm) return { lengthMm: largestCm * 10 };

  const largestMm = firstNumber(normalized, [
    /(?:до|размер(?:ом|ы)?|диаметр(?:ом)?|d)\s*(\d+(?:\.\d+)?)\s*(?:мм|mm)/i,
  ]);
  if (largestMm) return { lengthMm: largestMm };

  return {};
}

function parseMenopause(text: string): Menopause | undefined {
  if (includesAny(text, ["постменопауза", "менопауза", "postmenopause", "post-menopause"])) return "post";
  if (includesAny(text, ["пременопауза", "репродуктив", "pre menopause", "premenopause"])) return "pre";
  return undefined;
}

function parseStructure(text: string): Structure | undefined {
  if (includesAny(text, ["солидн", "solid"])) return "solid";
  if (includesAny(text, ["многокамер", "мультилокуляр", "multilocular", "несколько камер"])) return "multilocular";
  if (includesAny(text, ["однокамер", "унилокуляр", "unilocular", "простая киста", "анэхогенн"])) return "unilocular";
  return undefined;
}

function parseSubtype(text: string): UnilocularSubtype | undefined {
  if (includesAny(text, ["простая киста", "simple cyst", "анэхогенн"])) return "simple_cyst";
  if (includesAny(text, ["геморраг", "hemorrhagic"])) return "hemorrhagic";
  if (includesAny(text, ["эндометри", "endometrioma"])) return "endometrioma";
  if (includesAny(text, ["дермоид", "тератом", "dermoid"])) return "dermoid";
  if (includesAny(text, ["параовари", "paraovarian"])) return "paraovarian";
  if (includesAny(text, ["гидросальпинкс", "hydrosalpinx"])) return "hydrosalpinx";
  return undefined;
}

function parseBloodFlow(text: string): BloodFlow | undefined {
  if (hasNegated(text, ["кровоток", "васкуляризация", "допплер"])) return "none";
  if (includesAny(text, ["выраженный кровоток", "color score 4", "cs 4", "обильная васкуляризация"])) return "marked";
  if (includesAny(text, ["умеренный кровоток", "color score 3", "cs 3"])) return "moderate";
  if (includesAny(text, ["скудный кровоток", "минимальный кровоток", "color score 2", "cs 2"])) return "minimal";
  if (includesAny(text, ["кровоток", "васкуляризация", "допплер"])) return "minimal";
  return undefined;
}

export function parseOradsText(rawText: string): OradsTextParseResult {
  const text = rawText.toLowerCase();
  const warnings: string[] = [];
  const findings: OradsTextFinding[] = [];
  const dimensions = parseDimensions(text);
  const menopause = parseMenopause(text);
  const structure = parseStructure(text);
  const subtype = parseSubtype(text);
  const bloodFlow = parseBloodFlow(text);

  const ascites =
    includesAny(text, ["асцит", "свободная жидкость"]) && !hasNegated(text, ["асцит", "свободная жидкость"]);
  const peritonealNodules =
    includesAny(text, ["перитонеальные", "импланты", "канцероматоз", "узлы брюшины"]) &&
    !hasNegated(text, ["перитонеальные", "импланты", "канцероматоз", "узлы брюшины"]);
  const papillary =
    includesAny(text, ["папилляр", "сосочков"]) && !hasNegated(text, ["папилляр", "сосочков"]);
  const solidComponent =
    papillary ||
    (includesAny(text, ["солидный компонент", "solid component"]) &&
      !hasNegated(text, ["солидный компонент", "solid component"]));
  const thickSepta =
    includesAny(text, ["толстые перегородки", "утолщенные перегородки"]) &&
    !hasNegated(text, ["толстые перегородки", "утолщенные перегородки"]);

  const input: OradsInput = {
    localization: "ovarian",
    menopause,
    lesionKind: structure ? "nonphysiological" : undefined,
    structure,
    unilocularSubtype: structure === "unilocular" ? subtype ?? "other" : subtype,
    septaThickness: structure === "multilocular" ? (thickSepta ? "thick" : "thin") : undefined,
    solidComponent: solidComponent || structure === "solid" ? true : structure ? false : undefined,
    solidType: papillary ? "papillary" : structure === "solid" ? "smooth" : undefined,
    bloodFlow,
    ascites,
    peritonealNodules,
    ...dimensions,
  };

  if (menopause) findings.push({ label: "Менопауза", value: menopause === "post" ? "постменопауза" : "пременопауза", confidence: "medium" });
  if (structure) findings.push({ label: "Структура", value: structure, confidence: "high" });
  if (subtype) findings.push({ label: "Паттерн", value: subtype, confidence: "medium" });
  if (dimensions.lengthMm) {
    findings.push({
      label: "Размер",
      value: [dimensions.lengthMm, dimensions.widthMm, dimensions.heightMm].filter(Boolean).join(" x ") + " мм",
      confidence: dimensions.widthMm && dimensions.heightMm ? "high" : "medium",
    });
  }
  if (bloodFlow) findings.push({ label: "Кровоток", value: bloodFlow, confidence: "medium" });
  if (solidComponent) findings.push({ label: "Солидный компонент", value: papillary ? "папиллярный" : "есть", confidence: "medium" });
  if (ascites) findings.push({ label: "Асцит/жидкость", value: "есть", confidence: "medium" });
  if (peritonealNodules) findings.push({ label: "Перитонеальные признаки", value: "есть", confidence: "medium" });

  if (!menopause) warnings.push("Менопаузальный статус не найден: укажите вручную для точной категории.");
  if (!structure) warnings.push("Тип образования не найден: проверьте структуру вручную.");
  if (!dimensions.lengthMm) warnings.push("Размер не найден: добавьте максимальный размер или 3 измерения.");

  const result = calculateORADS(input);
  return {
    input,
    findings,
    warnings,
    protocolLine: buildProtocolOneLiner(result),
    reportText: buildReportText(input, result),
  };
}
