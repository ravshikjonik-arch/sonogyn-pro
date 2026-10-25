import type { OradsUs2022Input } from "@repo/orads-us/pro";

const MORPH_LABEL: Record<string, string> = {
  normal: "Норма / физиология",
  classic: "Classic benign",
  unilocular: "Однокамерная киста",
  bilocular: "Двухкамерная киста",
  multilocular: "Многокамерная киста",
  solid: "Солидное образование",
};

const MENOPAUSE_LABEL: Record<string, string> = {
  pre: "Пременопауза",
  postEarly: "Постменопауза < 5 лет",
  postLate: "Постменопауза ≥ 5 лет",
};

/** Строки для «листа превью» (refero-style), без PHI. */
export function formatOradsPreviewLines(input: OradsUs2022Input): string[] {
  const lines: string[] = [];
  if (input.incomplete) {
    lines.push("Исследование технически неполное (O-RADS 0).");
    return lines;
  }
  if (input.morphology) {
    lines.push(MORPH_LABEL[input.morphology] ?? input.morphology);
  }
  if (input.classicType) lines.push(`Classic benign: ${input.classicType}`);
  if (input.menopause) lines.push(MENOPAUSE_LABEL[input.menopause] ?? input.menopause);
  if (input.menopause === "pre" && input.cycleRegularity) {
    lines.push(`Цикл: ${input.cycleRegularity === "regular" ? "регулярный" : "нерегулярный"}`);
  }
  if (input.sizeCm != null) lines.push(`Макс. диаметр ${input.sizeCm} см`);
  if (input.morphology === "unilocular" && !input.solidComponent) {
    lines.push(input.cystContent === "simple" ? "Простое содержимое" : "Непростое содержимое");
  }
  if (["unilocular", "bilocular", "multilocular"].includes(input.morphology)) {
    lines.push(input.solidComponent ? "Солидный компонент ≥3 мм" : "Без солидного компонента");
  }
  if (input.innerContour === "irregular") lines.push("Неровный внутренний контур");
  if (input.papillae && input.papillae !== "0") lines.push(`Папилляры: ${input.papillae}`);
  if (input.colorScore) lines.push(`Color score IOTA: ${input.colorScore}`);
  if (input.outerContour === "irregular") lines.push("Неровный наружный контур");
  if (input.shadowing) lines.push("Акустическая тень");
  if (input.extraSigns === "ascites") lines.push("Асцит");
  if (input.extraSigns === "peritoneal") lines.push("Узелки брюшины");
  if (!lines.length) lines.push("Выберите морфологию и признаки слева.");
  return lines;
}
