import type { OradsExtractedInput } from "../parseOradsProtocolText";

export const ORADS_PROTOCOL_DRAFT_DISCLAIMER =
  "Черновик по диктовке — не диагноз. Категория O-RADS только после верификации врачом в калькуляторе.";

/** Rule-based protocol prose (parity with protocol-ai worker, no LLM). */
export function buildOradsProtocolDraft(text: string, extracted: OradsExtractedInput): string {
  const loc =
    extracted.localization === "extraovarian"
      ? "внеяичниковое"
      : extracted.ovarySide === "left"
        ? "левого яичника"
        : extracted.ovarySide === "right"
          ? "правого яичника"
          : "придатков";

  const structLabel =
    extracted.structure === "solid"
      ? "солидное"
      : extracted.structure === "complex"
        ? "сложное кистозное"
        : extracted.structure === "cystic"
          ? "кистозное"
          : extracted.lesionClass === "normal"
            ? "без очаговых образований"
            : "образование";

  const sizeParts: string[] = [];
  if (extracted.lengthMm) sizeParts.push(`L ${extracted.lengthMm} мм`);
  if (extracted.widthMm) sizeParts.push(`W ${extracted.widthMm} мм`);
  if (extracted.heightMm) sizeParts.push(`H ${extracted.heightMm} мм`);
  if (!sizeParts.length && extracted.diameterMm) sizeParts.push(`макс. ${extracted.diameterMm} мм`);
  const sizeLine = sizeParts.length ? sizeParts.join(", ") : "размеры уточнить";

  const lines = [
    "УЗИ органов малого таза (черновик по диктовке):",
    `В области ${loc}: ${structLabel}, ${sizeLine}.`,
  ];

  if (extracted.echogenicity === "anechoic") lines.push("Содержимое анэхогенное.");
  if (extracted.contour === "smooth") lines.push("Контуры гладкие.");
  if (extracted.contour === "irregular") lines.push("Контуры неровные — уточнить морфологию.");
  if (extracted.septations === "none") lines.push("Внутренних перегородок не выявлено.");
  if (extracted.septations === "thin") lines.push("Тонкие перегородки.");
  if (extracted.septations === "thick") lines.push("Утолщённые перегородки.");
  if (extracted.solidComponent) {
    const mm =
      extracted.solidComponentMm !== undefined ? ` (${extracted.solidComponentMm} мм)` : "";
    lines.push(`Отмечается солидный компонент${mm} — оценить по O-RADS US v2022.`);
  }
  if (extracted.vascularity === "none") lines.push("Кровоток по ЦДК не определяется.");
  if (extracted.vascularity === "moderate") lines.push("Кровоток по ЦДК определяется.");
  if (extracted.vascularity === "high") lines.push("Кровоток усилен.");
  if (extracted.ascites === "present") {
    lines.push("Асцит — клиническая корреляция, исключить злокачественный процесс.");
  }

  lines.push("");
  lines.push("Заключение (черновик): см. калькулятор O-RADS после верификации признаков врачом.");
  lines.push(ORADS_PROTOCOL_DRAFT_DISCLAIMER);
  lines.push("");
  lines.push(`Исходная диктовка: ${text.slice(0, 500)}${text.length > 500 ? "…" : ""}`);
  return lines.join("\n");
}
