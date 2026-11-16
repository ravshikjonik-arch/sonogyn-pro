/**
 * SSOT слоёв матки (коронар / сагиттально) → поля FIGO.
 * Анатомия: полость → эндометрий → миометрий → сероза → шейка / придатки.
 * Не копирует чужие атласы — только нормированная геометрия для hit-test.
 */

import { formatMeasurementRu, roundMeasurementMm } from "@repo/medical-calculations";

export type UterusNormPoint = { x: number; y: number };

export type UterusProjection = "coronal" | "sagittal";

export type UterusOrganZone =
  | "fundus"
  | "uterus_body"
  | "cervix"
  | "right_adnexa"
  | "left_adnexa";

/** Клинический слой относительно полости / серозы. */
export type UterusTissueLayer =
  | "cavity"
  | "endometrium"
  | "myometrium_inner"
  | "myometrium_mid"
  | "myometrium_outer"
  | "serosa_extra"
  | "cervix"
  | "adnexa";

export type UterusLesionKind = "myoma" | "adenomyosis" | "polyp" | "endometrioma" | "other";

export type EndometriumRelation = "none" | "contact" | "intracavitary";
export type SerosaRelation = "none" | "contact" | "extracavitary";
export type FibroidLocation = "anterior" | "posterior" | "fundal" | "cervical" | "other";

export type UterusLayerHit = {
  zone: UterusOrganZone;
  layer: UterusTissueLayer;
  /** 0 = центр полости, 1 = наружная сероза (тело). */
  depth01: number;
  location: FibroidLocation;
  relationToEndometrium: EndometriumRelation;
  relationToSerosa: SerosaRelation;
  intramuralPercentage: number;
};

export type UterusLesionMarker = {
  id: string;
  kind: UterusLesionKind;
  diameterMm: number;
  pedunculated: boolean;
  coronal: UterusNormPoint;
  sagittal: UterusNormPoint;
  stroke?: UterusNormPoint[];
  strokeProjection?: UterusProjection;
  /** Ручной override FIGO (врач подтверждает). */
  figoOverride?: number;
};

export const FIGO_SUBTYPE_RU: Record<number, string> = {
  0: "FIGO 0 — субмукозная на ножке (интракавитарно)",
  1: "FIGO 1 — субмукозная, интрамуральный компонент <50% среднего диаметра",
  2: "FIGO 2 — субмукозная, интрамуральный компонент ≥50% среднего диаметра",
  3: "FIGO 3 — интрамуральная, контакт с эндометрием",
  4: "FIGO 4 — полностью интрамуральная",
  5: "FIGO 5 — субсерозная, интрамуральный компонент ≥50% среднего диаметра",
  6: "FIGO 6 — субсерозная, интрамуральный компонент <50% среднего диаметра",
  7: "FIGO 7 — субсерозная на ножке",
  8: "FIGO 8 — иная локализация (в т.ч. шейка)",
};

export const KIND_LABEL_RU: Record<UterusLesionKind, string> = {
  myoma: "миоматозный узел / лейомиома",
  adenomyosis: "очаг аденомиоза",
  polyp: "полип эндометрия",
  endometrioma: "эндометриома (придатки)",
  other: "образование",
};

export const LAYER_LABEL_RU: Record<UterusTissueLayer, string> = {
  cavity: "полость матки",
  endometrium: "эндометрий / субмукозно",
  myometrium_inner: "внутренний миометрий (у эндометрия)",
  myometrium_mid: "средний миометрий (интрамурально)",
  myometrium_outer: "наружный миометрий (у серозы)",
  serosa_extra: "субсерозно / вне контура",
  cervix: "шейка матки",
  adnexa: "придатки",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function hypot(dx: number, dy: number) {
  return Math.hypot(dx, dy);
}

/** Коронар: эллипс полости (треугольная полость упрощена до эллипса для hit-test). */
const CORONAL_CAVITY = { cx: 0.5, cy: 0.4, rx: 0.09, ry: 0.14 };
/** Коронар: наружный контур тела матки. */
const CORONAL_SEROSA = { cx: 0.5, cy: 0.42, rx: 0.22, ry: 0.28 };

/** Сагиттально: полость (щель) и тело. */
const SAGITTAL_CAVITY = { cx: 0.52, cy: 0.42, rx: 0.055, ry: 0.2 };
const SAGITTAL_SEROSA = { cx: 0.5, cy: 0.44, rx: 0.2, ry: 0.32 };

function ellipseNormDist(
  p: UterusNormPoint,
  e: { cx: number; cy: number; rx: number; ry: number },
): number {
  return hypot((p.x - e.cx) / e.rx, (p.y - e.cy) / e.ry);
}

export function detectOrganZoneCoronal(p: UterusNormPoint): UterusOrganZone {
  if (p.y < 0.16) return "fundus";
  if (p.y > 0.72 || (p.y > 0.64 && p.x > 0.38 && p.x < 0.62)) return "cervix";
  if (p.x < 0.24 && p.y > 0.2 && p.y < 0.62) return "right_adnexa";
  if (p.x > 0.76 && p.y > 0.2 && p.y < 0.62) return "left_adnexa";
  return "uterus_body";
}

export function detectOrganZoneSagittal(p: UterusNormPoint): UterusOrganZone {
  if (p.y < 0.18) return "fundus";
  if (p.y > 0.74) return "cervix";
  return "uterus_body";
}

export function detectOrganZone(p: UterusNormPoint, projection: UterusProjection = "coronal"): UterusOrganZone {
  return projection === "sagittal" ? detectOrganZoneSagittal(p) : detectOrganZoneCoronal(p);
}

function locationFromHit(
  p: UterusNormPoint,
  zone: UterusOrganZone,
  projection: UterusProjection,
): FibroidLocation {
  if (zone === "cervix") return "cervical";
  if (zone === "fundus") return "fundal";
  if (zone === "right_adnexa" || zone === "left_adnexa") return "other";
  if (projection === "sagittal") {
    // x < 0.5 — задняя стенка, x > 0.5 — передняя (учебная сагиттальная схема)
    return p.x < 0.48 ? "posterior" : p.x > 0.52 ? "anterior" : "fundal";
  }
  // Коронар: латеральнее — боковые стенки; для текста используем A/P упрощённо по стороне
  return p.x < 0.5 ? "anterior" : "posterior";
}

/**
 * Глубина в теле матки: 0 в центре полости, 1 на серозе.
 * Вне серозы > 1.
 */
function bodyDepth01(
  p: UterusNormPoint,
  cavity: { cx: number; cy: number; rx: number; ry: number },
  serosa: { cx: number; cy: number; rx: number; ry: number },
): number {
  const dCav = ellipseNormDist(p, cavity);
  const dSer = ellipseNormDist(p, serosa);
  if (dCav <= 1) return clamp(dCav * 0.15, 0, 0.15);
  if (dSer <= 1) {
    // Interpolate between cavity rim (≈1) and serosa rim (dSer→1)
    const t = (dCav - 1) / Math.max(0.001, dSer + (dCav - 1));
    return clamp(0.15 + t * 0.85, 0.15, 1);
  }
  return 1 + (dSer - 1) * 0.5;
}

function layerFromDepth(depth01: number, zone: UterusOrganZone): UterusTissueLayer {
  if (zone === "cervix") return "cervix";
  if (zone === "right_adnexa" || zone === "left_adnexa") return "adnexa";
  if (depth01 <= 0.18) return "cavity";
  if (depth01 <= 0.32) return "endometrium";
  if (depth01 <= 0.5) return "myometrium_inner";
  if (depth01 <= 0.78) return "myometrium_mid";
  if (depth01 <= 1.02) return "myometrium_outer";
  return "serosa_extra";
}

function figoFieldsFromLayer(
  layer: UterusTissueLayer,
  depth01: number,
  diameterMm: number,
  pedunculated: boolean,
  location: FibroidLocation,
): Pick<UterusLayerHit, "relationToEndometrium" | "relationToSerosa" | "intramuralPercentage"> {
  if (location === "cervical" || location === "other" || layer === "cervix" || layer === "adnexa") {
    return { relationToEndometrium: "none", relationToSerosa: "none", intramuralPercentage: 100 };
  }

  let relationToEndometrium: EndometriumRelation = "none";
  let relationToSerosa: SerosaRelation = "none";
  let intramuralPercentage = 100;

  switch (layer) {
    case "cavity":
      relationToEndometrium = "intracavitary";
      // Центр полости: на ножке → 0; без ножки мелкий интрамуральный → 1
      intramuralPercentage = pedunculated ? 0 : diameterMm >= 40 ? 40 : 20;
      break;
    case "endometrium":
      relationToEndometrium = "intracavitary";
      // Глубже к миометрию → ≥50% интрамурально (FIGO 2), иначе FIGO 1
      intramuralPercentage = pedunculated ? 0 : depth01 >= 0.26 ? 60 : 35;
      break;
    case "myometrium_inner":
      relationToEndometrium = "contact";
      intramuralPercentage = 100;
      break;
    case "myometrium_mid":
      relationToEndometrium = "none";
      relationToSerosa = "none";
      intramuralPercentage = 100;
      break;
    case "myometrium_outer":
      relationToSerosa = "contact";
      intramuralPercentage = depth01 >= 0.92 ? 40 : 65;
      break;
    case "serosa_extra":
      relationToSerosa = pedunculated ? "extracavitary" : "extracavitary";
      intramuralPercentage = pedunculated ? 0 : 25;
      break;
    default:
      break;
  }

  return { relationToEndometrium, relationToSerosa, intramuralPercentage };
}

export function hitUterusLayer(
  p: UterusNormPoint,
  projection: UterusProjection,
  diameterMm: number,
  pedunculated: boolean,
): UterusLayerHit {
  const zone = detectOrganZone(p, projection);
  const cavity = projection === "sagittal" ? SAGITTAL_CAVITY : CORONAL_CAVITY;
  const serosa = projection === "sagittal" ? SAGITTAL_SEROSA : CORONAL_SEROSA;
  const depth01 =
    zone === "cervix" || zone === "right_adnexa" || zone === "left_adnexa"
      ? 1.2
      : bodyDepth01(p, cavity, serosa);
  const layer = layerFromDepth(depth01, zone);
  const location = locationFromHit(p, zone, projection);
  const fields = figoFieldsFromLayer(layer, depth01, diameterMm, pedunculated, location);

  return {
    zone,
    layer,
    depth01,
    location,
    ...fields,
  };
}

/** Munro/FIGO 2011/2018 — по отношениям к эндометрию/серозе и доле интрамурального компонента. */
export function evaluateFigoType(input: {
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
  if (input.relation_to_serosa === "extracavitary") return input.pedunculated ? 7 : 6;
  return 8;
}

export function resolveFigoForMarker(marker: UterusLesionMarker, projection: UterusProjection = "coronal"): number {
  if (marker.figoOverride != null) return clamp(marker.figoOverride, 0, 8);
  const pt = projection === "sagittal" ? marker.sagittal : marker.coronal;
  const hit = hitUterusLayer(pt, projection, marker.diameterMm, marker.pedunculated);
  return evaluateFigoType({
    relation_to_endometrium: hit.relationToEndometrium,
    relation_to_serosa: hit.relationToSerosa,
    intramural_percentage: hit.intramuralPercentage,
    pedunculated: marker.pedunculated,
    location: hit.location,
  });
}

export function coronalToSagittal(p: UterusNormPoint): UterusNormPoint {
  const lateral = p.x - 0.5;
  return {
    x: clamp(0.5 + lateral * 0.85, 0.18, 0.82),
    y: clamp(p.y * 0.96 + 0.02, 0.12, 0.9),
  };
}

export function sagittalToCoronal(p: UterusNormPoint): UterusNormPoint {
  const lateral = p.x - 0.5;
  return {
    x: clamp(0.5 + lateral * 0.95, 0.12, 0.88),
    y: clamp((p.y - 0.02) / 0.96, 0.1, 0.9),
  };
}

export function zoneLabelRu(zone: UterusOrganZone): string {
  switch (zone) {
    case "fundus":
      return "дно матки (фундус)";
    case "cervix":
      return "шейка матки / перешеек";
    case "right_adnexa":
      return "правая придаточная область";
    case "left_adnexa":
      return "левая придаточная область";
    default:
      return "тело матки";
  }
}

export function wallRu(location: FibroidLocation): string {
  if (location === "anterior") return "передняя стенка";
  if (location === "posterior") return "задняя стенка";
  if (location === "fundal") return "дно матки";
  if (location === "cervical") return "шейка матки";
  return "иная проекция";
}

export function formatUterusLesionMarkerRu(
  marker: UterusLesionMarker,
  projection: UterusProjection = "coronal",
): string {
  const pt = projection === "sagittal" ? marker.sagittal : marker.coronal;
  const hit = hitUterusLayer(pt, projection, marker.diameterMm, marker.pedunculated);
  const zoneRu = zoneLabelRu(hit.zone);
  const layerRu = LAYER_LABEL_RU[hit.layer];
  const size =
    marker.diameterMm > 0
      ? `, ориентировочный размер ${formatMeasurementRu(marker.diameterMm)}×${formatMeasurementRu(roundMeasurementMm(marker.diameterMm * 0.85))}×${formatMeasurementRu(roundMeasurementMm(marker.diameterMm * 0.8))} мм`
      : "";

  if (marker.kind !== "myoma" || hit.zone === "right_adnexa" || hit.zone === "left_adnexa") {
    return `${KIND_LABEL_RU[marker.kind]}: проекция «${zoneRu}», слой «${layerRu}»${size}.`;
  }

  const figoType = resolveFigoForMarker(marker, projection);
  const figoLine = FIGO_SUBTYPE_RU[figoType] ?? `FIGO ${figoType}`;
  const wall = wallRu(hit.location);
  const view = projection === "sagittal" ? "сагиттальный" : "коронарный";

  return (
    `Миоматозный узел: ${zoneRu}, ${wall}, слой — ${layerRu}${size}. ${figoLine}. ` +
    `(Макет ${view}; долю интрамурального компонента и контакт с полостью/серозой подтвердите по УЗИ/МРТ.)`
  );
}

export function buildUterusProtocolBlock(
  markers: UterusLesionMarker[],
  projection: UterusProjection = "coronal",
): string {
  const view = projection === "sagittal" ? "сагиттальный разрез" : "коронарный разрез";
  if (!markers.length) return `Локализация образования: отметьте точку на макете матки (${view}).`;
  const lines = markers.map((m, i) => {
    const line = formatUterusLesionMarkerRu(m, projection);
    return markers.length > 1 ? `${i + 1}. ${line}` : line;
  });
  return [`Локализация по макету матки (${view}):`, ...lines].join("\n");
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

/** Заготовка под будущую 3D-синхронизацию (локальные координаты тела). */
export type Uterus3dAnchor = {
  /** Нормированная глубина 0–1 (полость→сероза). */
  depth01: number;
  /** Угол вокруг оси полости, радианы. */
  azimuth: number;
  /** Высота вдоль оси дно→шейка, 0–1. */
  axial01: number;
};

export function markerTo3dAnchor(
  marker: UterusLesionMarker,
  projection: UterusProjection = "coronal",
): Uterus3dAnchor {
  const pt = projection === "sagittal" ? marker.sagittal : marker.coronal;
  const hit = hitUterusLayer(pt, projection, marker.diameterMm, marker.pedunculated);
  const lateral = pt.x - 0.5;
  return {
    depth01: clamp(hit.depth01, 0, 1.2),
    azimuth: Math.atan2(lateral, 0.01),
    axial01: clamp(pt.y, 0, 1),
  };
}
