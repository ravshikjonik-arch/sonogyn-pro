import { evaluateBiradsMmg } from "./evaluate";
import { BIRADS_MMG_DISCLAIMER, BIRADS_MMG_SOURCE, mmgOptions } from "./options";
import type { BiradsMmgInput } from "./types";

function labelFor(options: { value: string; label: string }[], value?: string): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export function buildBiradsMmgProtocol(input: BiradsMmgInput): string {
  const result = evaluateBiradsMmg(input);
  const lines: string[] = [
    "ПРОТОКОЛ МАММОГРАФИИ · BI-RADS Mammography",
    BIRADS_MMG_SOURCE,
    "",
  ];

  if (input.localizationText?.trim()) {
    lines.push("ЛОКАЛИЗАЦИЯ", input.localizationText.trim(), "");
  }

  lines.push(
    "1. ПЛОТНОСТЬ ПАРЕНХИМЫ (ACR)",
    labelFor(mmgOptions.breastComposition, input.breastComposition),
    "",
    "2. ТИП НАХОДКИ",
    labelFor(mmgOptions.findingType, input.findingType),
    "",
  );

  if (input.findingType === "mass") {
    lines.push(
      "3. ДЕСКРИПТОРЫ ОБРАЗОВАНИЯ",
      `Форма: ${labelFor(mmgOptions.massShape, input.massShape)}`,
      `Край: ${labelFor(mmgOptions.massMargin, input.massMargin)}`,
      `Плотность: ${labelFor(mmgOptions.massDensity, input.massDensity)}`,
      "",
    );
  } else if (input.findingType === "calcifications") {
    lines.push(
      "3. КАЛЬЦИФИКАТЫ",
      `Морфология: ${labelFor(mmgOptions.calcMorphology, input.calcMorphology)}`,
      `Распределение: ${labelFor(mmgOptions.calcDistribution, input.calcDistribution)}`,
      "",
    );
  } else if (input.findingType === "asymmetry") {
    lines.push("3. АСИММЕТРИЯ", labelFor(mmgOptions.asymmetryType, input.asymmetryType), "");
  } else if (input.findingType === "architectural_distortion") {
    lines.push("3. НАРУШЕНИЕ АРХИТЕКТОНИКИ", "Описано как architectural distortion.", "");
  }

  const af = (input.associatedFeatures ?? []).map((v) => labelFor(mmgOptions.associatedFeatures, v));
  lines.push(
    "4. АССОЦИИРОВАННЫЕ ПРИЗНАКИ",
    af.length ? af.map((x) => `• ${x}`).join("\n") : "Не отмечены.",
    "",
    "5. СРАВНЕНИЕ",
    labelFor(mmgOptions.comparison, input.comparison),
    "",
    "6. ЗАКЛЮЧЕНИЕ",
    `${result.category} (риск ЗНО: ${result.riskRange})`,
    result.impression,
  );

  if (input.conclusionDraft?.trim()) {
    lines.push("", "Комментарий врача:", input.conclusionDraft.trim());
  }

  lines.push("", "---", BIRADS_MMG_DISCLAIMER);
  return lines.join("\n");
}
