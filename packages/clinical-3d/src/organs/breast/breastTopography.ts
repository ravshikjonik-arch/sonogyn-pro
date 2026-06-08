import type { BreastQuadrant } from "../../types";

export type BreastSide = "left" | "right";

/** Нормированные координаты на схеме (0–1), центр соска ≈ (0.5, 0.5). */
export type BreastNormPoint = { x: number; y: number };

export type BreastTopographyMarker = {
  id: string;
  side: BreastSide;
  point: BreastNormPoint;
  /** Опциональный контур (для эхограммы-схемы). */
  stroke?: BreastNormPoint[];
};

export type BreastLocationResult = {
  sideLabel: string;
  quadrantShort: string;
  quadrantFull: string;
  quadrantKey: BreastQuadrant;
  hour: number;
  distanceCm: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Часы на «циферблате» груди (12 — краниально, 3 — латерально у правой МЖ). */
export function breastClockHour(point: BreastNormPoint): number {
  const dx = point.x - 0.5;
  const dy = point.y - 0.5;
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
  const normalized = (angle + 360) % 360;
  const rounded = Math.round(normalized / 30) % 12;
  return rounded === 0 ? 12 : rounded;
}

export function getBreastLocation(point: BreastNormPoint, side: BreastSide): BreastLocationResult {
  const dx = point.x - 0.5;
  const dy = point.y - 0.5;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const distanceCm = Math.round(clamp((dist / 0.43) * 8, 0, 12) * 10) / 10;
  const upper = dy < 0;
  const outer = side === "right" ? dx < 0 : dx > 0;

  let quadrantShort: string;
  let quadrantKey: BreastQuadrant;

  if (dist < 0.08) {
    quadrantShort = "центр / ретроареолярно";
    quadrantKey = "retroareolar";
  } else if (upper && outer) {
    quadrantShort = "ВНК";
    quadrantKey = "upper_outer";
  } else if (upper && !outer) {
    quadrantShort = "ВВК";
    quadrantKey = "upper_inner";
  } else if (!upper && outer) {
    quadrantShort = "ННК";
    quadrantKey = "lower_outer";
  } else {
    quadrantShort = "НВК";
    quadrantKey = "lower_inner";
  }

  const quadrantFull =
    quadrantKey === "upper_outer"
      ? "верхне-наружный квадрант"
      : quadrantKey === "upper_inner"
        ? "верхне-внутренний квадрант"
        : quadrantKey === "lower_outer"
          ? "нижне-наружный квадрант"
          : quadrantKey === "lower_inner"
            ? "нижне-внутренний квадрант"
            : "подсосочная / центральная зона";

  return {
    sideLabel: side === "right" ? "Правая молочная железа" : "Левая молочная железа",
    quadrantShort,
    quadrantFull,
    quadrantKey,
    hour: breastClockHour(point),
    distanceCm,
  };
}

/** Формулировка для протокола УЗИ (как в BI-RADS-локализаторе). */
export function formatBreastLocationRu(point: BreastNormPoint, side: BreastSide): string {
  const loc = getBreastLocation(point, side);
  const dist =
    loc.distanceCm % 1 === 0 ? String(loc.distanceCm) : loc.distanceCm.toFixed(1).replace(".", ",");
  return `${loc.sideLabel}: ${loc.quadrantShort} (${loc.quadrantFull}), на ${loc.hour} часах, ${dist} см от соска.`;
}

export function formatBreastLocationShort(point: BreastNormPoint, side: BreastSide): string {
  const loc = getBreastLocation(point, side);
  const dist =
    loc.distanceCm % 1 === 0 ? String(loc.distanceCm) : loc.distanceCm.toFixed(1).replace(".", ",");
  return `${loc.quadrantShort}, ${loc.hour} ч, ${dist} см от соска`;
}

export function centroidOfStroke(points: BreastNormPoint[]): BreastNormPoint {
  if (!points.length) return { x: 0.5, y: 0.5 };
  const sum = points.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function strokeToSvgPath(points: BreastNormPoint[], width: number, height: number): string {
  if (points.length < 2) return "";
  const [first, ...rest] = points;
  const sx = first.x * width;
  const sy = first.y * height;
  return `M ${sx} ${sy} ${rest.map((p) => `L ${p.x * width} ${p.y * height}`).join(" ")}`;
}

export function buildBreastProtocolBlock(markers: BreastTopographyMarker[]): string {
  if (!markers.length) {
    return "Локализация образования: не указана (отметьте на схеме).";
  }
  const lines = markers.map((m, i) => {
    const loc = formatBreastLocationRu(m.point, m.side);
    return markers.length > 1 ? `${i + 1}. ${loc}` : loc;
  });
  return ["Локализация по схеме (УЗИ молочной железы):", ...lines].join("\n");
}
