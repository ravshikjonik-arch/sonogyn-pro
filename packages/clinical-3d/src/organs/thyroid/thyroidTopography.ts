export type ThyroidSide = "right" | "left" | "isthmus";

/** Нормированные координаты на фронтальной схеме щитовидной железы (0-1). */
export type ThyroidNormPoint = { x: number; y: number };

export type ThyroidTopographyMarker = {
  id: string;
  point: ThyroidNormPoint;
  stroke?: ThyroidNormPoint[];
};

export type ThyroidLocationResult = {
  side: ThyroidSide;
  sideLabel: string;
  segment: "upper" | "middle" | "lower";
  segmentLabel: string;
  mediolateral: "medial" | "central" | "lateral";
  mediolateralLabel: string;
  shortLabel: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function thyroidSegment(y: number): ThyroidLocationResult["segment"] {
  if (y < 0.36) return "upper";
  if (y > 0.66) return "lower";
  return "middle";
}

function segmentLabel(segment: ThyroidLocationResult["segment"]) {
  if (segment === "upper") return "верхняя треть";
  if (segment === "lower") return "нижняя треть";
  return "средняя треть";
}

function mediolateralZone(point: ThyroidNormPoint, side: ThyroidSide): ThyroidLocationResult["mediolateral"] {
  if (side === "isthmus") return "central";
  const centerX = side === "right" ? 0.3 : 0.7;
  const relative = point.x - centerX;
  if (Math.abs(relative) < 0.045) return "central";
  if (side === "right") return relative > 0 ? "medial" : "lateral";
  return relative < 0 ? "medial" : "lateral";
}

function mediolateralLabel(zone: ThyroidLocationResult["mediolateral"]) {
  if (zone === "medial") return "медиальный отдел";
  if (zone === "lateral") return "латеральный отдел";
  return "центральный отдел";
}

export function getThyroidLocation(rawPoint: ThyroidNormPoint): ThyroidLocationResult {
  const point = { x: clamp(rawPoint.x, 0, 1), y: clamp(rawPoint.y, 0, 1) };
  const side: ThyroidSide = point.x > 0.43 && point.x < 0.57 ? "isthmus" : point.x < 0.5 ? "right" : "left";
  const segment = thyroidSegment(point.y);
  const mediolateral = mediolateralZone(point, side);
  const sideLabel =
    side === "right"
      ? "Правая доля щитовидной железы"
      : side === "left"
        ? "Левая доля щитовидной железы"
        : "Перешеек щитовидной железы";
  const shortSide = side === "right" ? "правая доля" : side === "left" ? "левая доля" : "перешеек";

  return {
    side,
    sideLabel,
    segment,
    segmentLabel: segmentLabel(segment),
    mediolateral,
    mediolateralLabel: mediolateralLabel(mediolateral),
    shortLabel: `${shortSide}, ${segmentLabel(segment)}, ${mediolateralLabel(mediolateral)}`,
  };
}

/** Формулировка для протокола УЗИ щитовидной железы. */
export function formatThyroidLocationRu(point: ThyroidNormPoint): string {
  const loc = getThyroidLocation(point);
  return `${loc.sideLabel}: ${loc.segmentLabel}, ${loc.mediolateralLabel}.`;
}

export function centroidOfStroke(points: ThyroidNormPoint[]): ThyroidNormPoint {
  if (!points.length) return { x: 0.5, y: 0.5 };
  const sum = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function strokeToSvgPath(points: ThyroidNormPoint[], width: number, height: number): string {
  if (points.length < 2) return "";
  const [first, ...rest] = points;
  const sx = first.x * width;
  const sy = first.y * height;
  return `M ${sx} ${sy} ${rest.map((p) => `L ${p.x * width} ${p.y * height}`).join(" ")}`;
}

export function buildThyroidProtocolBlock(markers: ThyroidTopographyMarker[]): string {
  if (!markers.length) {
    return "Локализация узла щитовидной железы: не указана (отметьте на схеме).";
  }
  const lines = markers.map((m, i) => {
    const loc = formatThyroidLocationRu(m.point);
    return markers.length > 1 ? `${i + 1}. ${loc}` : loc;
  });
  return ["Локализация по схеме (УЗИ щитовидной железы):", ...lines].join("\n");
}
