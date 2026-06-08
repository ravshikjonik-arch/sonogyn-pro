/** Топография яичника на схеме (увеличенный / трансверзальный вид) — для протокола и O-RADS. */

export type OvarySide = "left" | "right";

export type OvaryNormPoint = { x: number; y: number };

export type OvaryMarkerKind =
  | "follicle"
  | "dominant_follicle"
  | "cyst_functional"
  | "cyst_hemorrhagic"
  | "cyst_dermoid"
  | "cyst_endometrioma"
  | "solid_component"
  | "other";

export type OvaryMorphologyPreset =
  | "normal"
  | "enlarged"
  | "multifollicular"
  | "polycystic_pattern";

export type OvaryTopographyMarker = {
  id: string;
  side: OvarySide;
  point: OvaryNormPoint;
  kind: OvaryMarkerKind;
  sizeMm?: number;
  stroke?: OvaryNormPoint[];
};

export const OVARY_MARKER_LABELS_RU: Record<OvaryMarkerKind, string> = {
  follicle: "Фолликул",
  dominant_follicle: "Доминантный фолликул",
  cyst_functional: "Функциональная киста",
  cyst_hemorrhagic: "Геморрагическая киста",
  cyst_dermoid: "Дермоид (зрелая тератома)",
  cyst_endometrioma: "Эндометриома",
  solid_component: "Солидный компонент",
  other: "Другое образование",
};

export const OVARY_MORPHOLOGY_LABELS_RU: Record<OvaryMorphologyPreset, string> = {
  normal: "Нормальные размеры",
  enlarged: "Увеличенный яичник",
  multifollicular: "Мультифолликулярный рисунок",
  polycystic_pattern: "Поликистозный рисунок (≥12 фолликулов 2–9 мм)",
};

export function centroidOfStroke(points: OvaryNormPoint[]): OvaryNormPoint {
  if (!points.length) return { x: 0.5, y: 0.5 };
  const sum = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function strokeToSvgPath(points: OvaryNormPoint[], width: number, height: number): string {
  if (points.length < 2) return "";
  const [first, ...rest] = points;
  const sx = first.x * width;
  const sy = first.y * height;
  return `M ${sx} ${sy} ${rest.map((p) => `L ${p.x * width} ${p.y * height}`).join(" ")}`;
}

/** Сектор на периферии (для локализации фолликулов по «циферблату»). */
export function ovaryClockSector(point: OvaryNormPoint): { hour: number; zone: "peripheral" | "central" } {
  const dx = point.x - 0.5;
  const dy = point.y - 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const normalized = (angle + 360) % 360;
  const hour = Math.round(normalized / 30) % 12 || 12;
  return { hour, zone: dist > 0.28 ? "peripheral" : "central" };
}

export function formatOvaryMarkerRu(marker: OvaryTopographyMarker): string {
  const side = marker.side === "right" ? "Правый яичник" : "Левый яичник";
  const kind = OVARY_MARKER_LABELS_RU[marker.kind];
  const { hour, zone } = ovaryClockSector(marker.point);
  const zoneRu = zone === "peripheral" ? "периферия (кортикальная зона)" : "центральная строма";
  const size =
    marker.sizeMm != null && marker.sizeMm > 0
      ? `, ${marker.sizeMm % 1 === 0 ? marker.sizeMm : marker.sizeMm.toFixed(1)} мм`
      : "";
  return `${side}: ${kind}${size} — сектор ~${hour} ч, ${zoneRu}.`;
}

export function buildOvaryProtocolBlock(
  markers: OvaryTopographyMarker[],
  morphology: OvaryMorphologyPreset,
): string {
  const morph = OVARY_MORPHOLOGY_LABELS_RU[morphology];
  if (!markers.length) {
    return [`Морфология по схеме: ${morph}.`, "Локализация фолликулов/кист: не отмечена на макете."].join("\n");
  }
  const lines = markers.map((m, i) => (markers.length > 1 ? `${i + 1}. ${formatOvaryMarkerRu(m)}` : formatOvaryMarkerRu(m)));
  return [`Морфология по схеме: ${morph}.`, "Локализация на УЗИ-схеме яичника:", ...lines].join("\n");
}

export function countMarkersByKind(markers: OvaryTopographyMarker[], side?: OvarySide) {
  const list = side ? markers.filter((m) => m.side === side) : markers;
  const follicles = list.filter((m) => m.kind === "follicle" || m.kind === "dominant_follicle").length;
  const cysts = list.filter((m) => m.kind.startsWith("cyst_")).length;
  return { follicles, cysts, total: list.length };
}
