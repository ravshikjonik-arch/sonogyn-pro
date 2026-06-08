/**
 * Локализация очага на коронарном макете матки (клик по схеме/фото).
 * FIGO subclassification — упрощённый алгоритм по координатам (как в mobile FigoFibroidInteractive).
 */

export type UterusNormPoint = { x: number; y: number };

export type UterusOrganZone =
  | "fundus"
  | "uterus_body"
  | "cervix"
  | "right_adnexa"
  | "left_adnexa";

export type UterusLesionKind = "myoma" | "adenomyosis" | "polyp" | "endometrioma" | "other";

export type UterusCoronalMarker = {
  id: string;
  point: UterusNormPoint;
  kind: UterusLesionKind;
  diameterMm: number;
  pedunculated: boolean;
  stroke?: UterusNormPoint[];
};

type EndometriumRelation = "none" | "contact" | "intracavitary";
type SerosaRelation = "none" | "contact" | "extracavitary";
type FibroidLocation = "anterior" | "posterior" | "fundal" | "cervical" | "other";

const FIGO_SUBTYPE_RU: Record<number, string> = {
  0: "FIGO 0 — субмукозная на ножке (интракавитарно)",
  1: "FIGO 1 — субмукозная, <50% интрамурально",
  2: "FIGO 2 — субмукозная, ≥50% интрамурально",
  3: "FIGO 3 — интрамуральная, контакт с эндометрием",
  4: "FIGO 4 — интрамуральная",
  5: "FIGO 5 — субсерозная, ≥50% интрамурально",
  6: "FIGO 6 — субсерозная, <50% интрамурально",
  7: "FIGO 7 — субсерозная на ножке",
  8: "FIGO 8 — иная локализация (в т.ч. шейка)",
};

const KIND_LABEL_RU: Record<UterusLesionKind, string> = {
  myoma: "миоматозный узел / лейомиома",
  adenomyosis: "очаг аденомиоза",
  polyp: "полип эндометрия",
  endometrioma: "эндометриома (придатки)",
  other: "образование",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function detectOrganZone(p: UterusNormPoint): UterusOrganZone {
  if (p.y < 0.14) return "fundus";
  if (p.y > 0.7 || (p.y > 0.62 && p.x > 0.38 && p.x < 0.62)) return "cervix";
  if (p.x < 0.26 && p.y > 0.18 && p.y < 0.62) return "right_adnexa";
  if (p.x > 0.74 && p.y > 0.18 && p.y < 0.62) return "left_adnexa";
  return "uterus_body";
}

function zoneLabelRu(zone: UterusOrganZone): string {
  switch (zone) {
    case "fundus":
      return "дно/верх матки (фундус)";
    case "cervix":
      return "шейка матки / перешеек";
    case "right_adnexa":
      return "правая придаточная область (яичник/труба)";
    case "left_adnexa":
      return "левая придаточная область (яичник/труба)";
    default:
      return "тело матки";
  }
}

function locationFromCoronalPoint(p: UterusNormPoint): FibroidLocation {
  const zone = detectOrganZone(p);
  if (zone === "cervix") return "cervical";
  if (zone === "fundus") return "fundal";
  if (zone === "right_adnexa" || zone === "left_adnexa") return "other";
  return p.x < 0.5 ? "anterior" : "posterior";
}

function deriveFigoFields(point: UterusNormPoint, diameterMm: number, pedunculated: boolean) {
  const location = locationFromCoronalPoint(point);
  let relationToEndometrium: EndometriumRelation = "none";
  let relationToSerosa: SerosaRelation = "none";
  let intramuralPercentage = 100;

  if (location === "cervical" || location === "other") {
    return { relationToEndometrium, relationToSerosa, intramuralPercentage, location };
  }

  const cx = 0.5;
  const cy = 0.38;
  const distCavity = Math.hypot(point.x - cx, point.y - cy);
  const insideCavity = distCavity < 0.1;
  const nearEndometrium = point.y > 0.42 && point.y < 0.58 && point.x > 0.42 && point.x < 0.58;
  const nearSerosa =
    point.y < 0.22 || point.y > 0.58 || point.x < 0.32 || point.x > 0.68 || distCavity > 0.2;

  if (pedunculated && insideCavity) {
    relationToEndometrium = "intracavitary";
    intramuralPercentage = 0;
  } else if (insideCavity || (nearEndometrium && point.y > 0.48)) {
    relationToEndometrium = "intracavitary";
    intramuralPercentage = diameterMm >= 35 ? 45 : 35;
  } else if (nearEndometrium) {
    relationToEndometrium = "contact";
    intramuralPercentage = 100;
  } else if (pedunculated && nearSerosa) {
    relationToSerosa = "extracavitary";
    intramuralPercentage = 0;
  } else if (nearSerosa) {
    relationToSerosa = "contact";
    intramuralPercentage = nearSerosa ? 40 : 65;
  }

  return { relationToEndometrium, relationToSerosa, intramuralPercentage, location };
}

function evaluateFigoType(input: {
  relation_to_endometrium: EndometriumRelation;
  relation_to_serosa: SerosaRelation;
  intramural_percentage: number;
  pedunculated: boolean;
  location: FibroidLocation;
}): number {
  const p = clamp(input.intramural_percentage, 0, 100);
  if (input.location === "cervical" || input.location === "other") return 8;
  if (input.pedunculated && input.relation_to_endometrium === "intracavitary") return 0;
  if (input.relation_to_endometrium === "intracavitary") return p < 50 ? 1 : 2;
  if (input.relation_to_endometrium === "contact") return 3;
  if (input.relation_to_endometrium === "none" && input.relation_to_serosa === "none") return 4;
  if (input.relation_to_serosa === "contact") return p >= 50 ? 5 : 6;
  if (input.pedunculated && input.relation_to_serosa === "extracavitary") return 7;
  return 8;
}

function wallRu(location: FibroidLocation): string {
  if (location === "anterior") return "передняя стенка";
  if (location === "posterior") return "задняя стенка";
  if (location === "fundal") return "дно матки";
  if (location === "cervical") return "шейка матки";
  return "иная проекция";
}

export function formatUterusCoronalMarkerRu(marker: UterusCoronalMarker): string {
  const zone = detectOrganZone(marker.point);
  const zoneRu = zoneLabelRu(zone);
  const size =
    marker.diameterMm > 0
      ? `, ориентировочный размер ${marker.diameterMm}×${Math.round(marker.diameterMm * 0.85)}×${Math.round(marker.diameterMm * 0.8)} мм`
      : "";

  if (marker.kind !== "myoma" || zone === "right_adnexa" || zone === "left_adnexa") {
    const side =
      zone === "right_adnexa" ? "справа" : zone === "left_adnexa" ? "слева" : "матка";
    return `${KIND_LABEL_RU[marker.kind]}: проекция «${zoneRu}» (${side})${size}.`;
  }

  const figoFields = deriveFigoFields(marker.point, marker.diameterMm, marker.pedunculated);
  const figoType = evaluateFigoType({
    relation_to_endometrium: figoFields.relationToEndometrium,
    relation_to_serosa: figoFields.relationToSerosa,
    intramural_percentage: figoFields.intramuralPercentage,
    pedunculated: marker.pedunculated,
    location: figoFields.location,
  });
  const wall = wallRu(figoFields.location);
  const figoLine = FIGO_SUBTYPE_RU[figoType] ?? `FIGO ${figoType}`;

  return (
    `Миоматозный узел: ${zoneRu}, ${wall}${size}. ${figoLine}. ` +
    `(Схема коронарного разреза; уточните слой миометрия и отношение к полости/серозе по УЗИ/МРТ.)`
  );
}

export function buildUterusCoronalProtocolBlock(markers: UterusCoronalMarker[]): string {
  if (!markers.length) return "Локализация образования: отметьте точку на макете матки.";
  const lines = markers.map((m, i) => {
    const line = formatUterusCoronalMarkerRu(m);
    return markers.length > 1 ? `${i + 1}. ${line}` : line;
  });
  return ["Локализация по макету матки (коронарный разрез):", ...lines].join("\n");
}

export function centroidOfStroke(points: UterusNormPoint[]): UterusNormPoint {
  if (!points.length) return { x: 0.5, y: 0.4 };
  const s = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / points.length, y: s.y / points.length };
}

export function strokeToSvgPath(points: UterusNormPoint[], w: number, h: number): string {
  if (points.length < 2) return "";
  const [f, ...rest] = points;
  return `M ${f.x * w} ${f.y * h} ${rest.map((p) => `L ${p.x * w} ${p.y * h}`).join(" ")}`;
}

export const UTERUS_CORONAL_ANATOMY_SRC = "/clinical/uterus-coronal-anatomy.png";
