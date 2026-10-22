import type { OradsInput } from "@repo/orads-us/pro";
import { formatMeasurementDecimal } from "@repo/medical-calculations";

export function maxDiameterMm(input: OradsInput): number | null {
  const vals = [input.lengthMm, input.widthMm, input.heightMm].filter(
    (v): v is number => typeof v === "number" && v > 0,
  );
  if (!vals.length) return null;
  return Math.max(...vals);
}

export function formatLocalization(input: OradsInput): string | null {
  if (input.localization === "extraovarian") return "экстраовариальная локализация";
  if (input.localization === "ovarian") return "яичник / придаток"; // VERIFY: сторона (правый/левый) — отдельное поле в UI
  return null;
}

export function formatStructure(input: OradsInput): string | null {
  if (input.structure === "solid") return "солидная";
  if (input.structure === "multilocular") return "смешанная / многокамерная";
  if (input.structure === "unilocular") return "кистозная / однокамерная";
  return null;
}

export function formatSolidType(input: OradsInput): string | null {
  if (!input.solidComponent) return "солидный компонент не выявлен";
  if (input.solidType === "papillary") return "папиллярные разрастания";
  if (input.solidType === "irregular") return "неровный солидный компонент";
  if (input.solidType === "smooth") return "ровный солидный компонент";
  return "солидный компонент отмечается";
}

export function formatSepta(input: OradsInput): string | null {
  if (input.septaThickness === "thin") return "тонкие";
  if (input.septaThickness === "thick") return "утолщённые";
  if (input.septaCount === "0") return "нет";
  if (input.septaCount) return `перегородки (${input.septaCount})`;
  return null;
}

export function formatPapillary(input: OradsInput): string | null {
  const c = input.papillaryProjectionCount;
  if (!c || c === "0") return "не выявлены";
  if (c === "4plus") return "≥4, высота — уточнить в протоколе"; // VERIFY: высота папилл в мм
  return `${c}, поверхность ${input.papillaryProjectionSurface ?? "не указана"}`;
}

export function formatEchogenicity(input: OradsInput): string | null {
  const map: Record<NonNullable<OradsInput["echogenicity"]>, string> = {
    anechoic: "анэхогенная",
    hypo: "гипоэхогенная",
    iso: "изоэхогенная",
    hyper: "гиперэхогенная",
  };
  return input.echogenicity ? map[input.echogenicity] : null;
}

export function formatBloodFlow(input: OradsInput): string | null {
  const map: Record<NonNullable<OradsInput["bloodFlow"]>, string> = {
    none: "не определяется",
    minimal: "минимальный",
    moderate: "умеренный",
    marked: "выраженный",
  };
  return input.bloodFlow ? map[input.bloodFlow] : null;
}

export function formatDimensions(input: OradsInput): string | null {
  const l = input.lengthMm;
  const w = input.widthMm;
  const h = input.heightMm;
  if (l && w && h) {
    return `${formatMeasurementDecimal(l)} × ${formatMeasurementDecimal(w)} × ${formatMeasurementDecimal(h)} мм`;
  }
  const max = maxDiameterMm(input);
  return max != null ? `${formatMeasurementDecimal(max)} мм (наибольший размер)` : null;
}

export function formatExtraFeatures(input: OradsInput): string[] {
  const out: string[] = [];
  if (input.acousticShadows) out.push("акустическая тень");
  if (input.ascites) out.push("асцит");
  if (input.peritonealNodules) out.push("перитонеальные узелки");
  if (input.incompleteSeptum) out.push("неполная перегородка (2-я плоскость)");
  return out;
}
