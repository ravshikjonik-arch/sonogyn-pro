export type OvarianDescriptionFeatures = {
  structure: "cystic" | "solid" | "mixed";
  locules: "unilocular" | "multilocular";
  echogenicity: "anechoic" | "low-level" | "hyperechoic";
  wall: "smooth" | "irregular";
  septa: "none" | "thin" | "thick";
  solidComponent: boolean;
  vascularity: "none" | "peripheral" | "internal";
};

function structureText(value: OvarianDescriptionFeatures["structure"]) {
  if (value === "solid") return "преимущественно солидное";
  if (value === "mixed") return "смешанное кистозно-солидное";
  return "кистозное";
}

function loculesText(value: OvarianDescriptionFeatures["locules"]) {
  return value === "multilocular" ? "многокамерное" : "однокамерное";
}

function echogenicityText(value: OvarianDescriptionFeatures["echogenicity"]) {
  if (value === "low-level") return "с низкоуровневыми эхосигналами";
  if (value === "hyperechoic") return "гиперэхогенное";
  return "анэхогенное";
}

function wallText(value: OvarianDescriptionFeatures["wall"]) {
  return value === "irregular" ? "с неровными стенками" : "с ровными стенками";
}

function septaText(value: OvarianDescriptionFeatures["septa"]) {
  if (value === "thin") return "с тонкими перегородками";
  if (value === "thick") return "с утолщенными перегородками";
  return "без перегородок";
}

function vascularityText(value: OvarianDescriptionFeatures["vascularity"]) {
  if (value === "peripheral") return "с периферическим кровотоком";
  if (value === "internal") return "с внутренним кровотоком";
  return "без кровотока";
}

export function generateDescription(features: OvarianDescriptionFeatures): string {
  const parts: string[] = [
    loculesText(features.locules),
    structureText(features.structure),
    echogenicityText(features.echogenicity),
    wallText(features.wall),
    septaText(features.septa),
    features.solidComponent ? "с солидным компонентом" : "без солидного компонента",
    vascularityText(features.vascularity),
  ];
  const text = `${parts.join(", ")}.`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getDescriptionKeywords(features: OvarianDescriptionFeatures): string[] {
  return [
    loculesText(features.locules),
    echogenicityText(features.echogenicity),
    wallText(features.wall),
    vascularityText(features.vascularity),
  ];
}

export function explainDescription(features: OvarianDescriptionFeatures): string {
  const reasons: string[] = [];
  reasons.push(features.locules === "multilocular" ? "Указана многокамерность (есть >1 камеры)." : "Указана однокамерность.");
  reasons.push(
    features.wall === "irregular" ? "Выбраны неровные стенки, это отражено в формулировке." : "Выбраны ровные стенки."
  );
  reasons.push(
    features.vascularity === "none"
      ? "Кровоток не определяется."
      : features.vascularity === "peripheral"
        ? "Отмечен периферический кровоток."
        : "Отмечен внутренний кровоток."
  );
  return reasons.join(" ");
}

export const OVARIAN_DESCRIPTION_EXAMPLE =
  "Однокамерное анэхогенное образование с ровными стенками, без перегородок, без солидного компонента, без кровотока.";
