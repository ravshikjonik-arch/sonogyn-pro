import {
  EU_CATEGORY_META,
  EU_COMPOSITION_OPTIONS,
  EU_ECHOGENICITY_OPTIONS,
  EU_ETE_OPTIONS,
  EU_LYMPH_NODE_OPTIONS,
  EU_MARGINS_OPTIONS,
  EU_MICROCALCIFICATIONS_OPTIONS,
  EU_SHAPE_OPTIONS,
  type EuOption,
} from "./lexicon";
import { euClinicalWarnings, manageEuNodule } from "./management";
import { EU_SOURCES, EU_TIRADS_ENGINE_VERSION } from "./sources";
import type {
  EuFeatureField,
  EuHighRiskFeature,
  EuPolicyProfile,
  EuTiradsCategory,
  EuTiradsInput,
  EuTiradsResult,
  EuValidationError,
  EuWarning,
} from "./types";

const MAX_PLAUSIBLE_DIAMETER_MM = 200;

const HIGH_RISK_LABEL_RU: Record<EuHighRiskFeature, string> = {
  non_oval_shape: "неовальная форма",
  irregular_margins: "неровные контуры",
  microcalcifications: "микрокальцинаты",
  marked_hypoechogenicity: "выраженная гипоэхогенность",
};

function checkEnum<T extends string>(
  errors: EuValidationError[],
  field: keyof EuTiradsInput,
  value: unknown,
  options: EuOption<T>[],
): void {
  if (value === undefined) return;
  if (!options.some((o) => o.value === value)) {
    errors.push({ field, messageRu: `Недопустимое значение поля «${String(field)}».` });
  }
}

export function validateEuTiradsInput(input: EuTiradsInput): EuValidationError[] {
  const errors: EuValidationError[] = [];
  checkEnum(errors, "composition", input.composition, EU_COMPOSITION_OPTIONS);
  checkEnum(errors, "echogenicity", input.echogenicity, EU_ECHOGENICITY_OPTIONS);
  checkEnum(errors, "shape", input.shape, EU_SHAPE_OPTIONS);
  checkEnum(errors, "margins", input.margins, EU_MARGINS_OPTIONS);
  checkEnum(errors, "microcalcifications", input.microcalcifications, EU_MICROCALCIFICATIONS_OPTIONS);
  checkEnum(errors, "extrathyroidalExtension", input.extrathyroidalExtension, EU_ETE_OPTIONS);
  checkEnum(errors, "lymphNodes", input.lymphNodes, EU_LYMPH_NODE_OPTIONS);

  if (input.maxDiameterMm !== undefined) {
    const s = input.maxDiameterMm;
    if (typeof s !== "number" || !Number.isFinite(s) || s <= 0) {
      errors.push({ field: "maxDiameterMm", messageRu: "Размер узла должен быть положительным числом (мм)." });
    } else if (s > MAX_PLAUSIBLE_DIAMETER_MM) {
      errors.push({ field: "maxDiameterMm", messageRu: `Размер больше ${MAX_PLAUSIBLE_DIAMETER_MM} мм — проверьте единицы (мм).` });
    }
  }

  const benignComposition = input.composition === "pure_cyst" || input.composition === "entirely_spongiform";
  if (benignComposition && highRiskFeaturesOf(input).length > 0) {
    errors.push({
      field: "composition",
      messageRu:
        "Чистая киста или полностью губчатый узел не сочетаются с признаками высокого риска — уточните состав узла.",
    });
  }
  return errors;
}

function highRiskFeaturesOf(input: EuTiradsInput): EuHighRiskFeature[] {
  const out: EuHighRiskFeature[] = [];
  if (input.shape === "non_oval") out.push("non_oval_shape");
  if (input.margins === "irregular") out.push("irregular_margins");
  if (input.microcalcifications === "present") out.push("microcalcifications");
  if (input.echogenicity === "markedly_hypoechoic") out.push("marked_hypoechogenicity");
  return out;
}

const SOLID_FEATURE_FIELDS: EuFeatureField[] = ["echogenicity", "shape", "margins", "microcalcifications"];

const FIELD_LABEL_RU: Record<EuFeatureField, string> = {
  composition: "состав",
  echogenicity: "эхогенность",
  shape: "форма",
  margins: "контуры",
  microcalcifications: "микрокальцинаты",
};

function ok(
  category: EuTiradsCategory,
  input: EuTiradsInput,
  profile: EuPolicyProfile,
  highRisk: EuHighRiskFeature[],
  notAssessed: EuFeatureField[],
  rationaleRu: string[],
): EuTiradsResult {
  const warnings: EuWarning[] = euClinicalWarnings(input, profile);
  if (input.highRiskFeaturesUncertain && category < 4) {
    warnings.push({
      code: "high_risk_uncertain",
      messageRu:
        "Вы отметили сомнение в признаках высокого риска. ETA предлагает в таком случае EU-TIRADS 4 — решение врача; рассчитанная категория не изменена.",
      source: EU_SOURCES.ETA_2023,
    });
  }
  if (notAssessed.length > 0) {
    warnings.push({
      code: "features_not_assessed",
      messageRu: `Не оценены: ${notAssessed.map((f) => FIELD_LABEL_RU[f]).join(", ")}. Категорию это не меняет, но для протокола их стоит описать.`,
    });
  }
  const meta = EU_CATEGORY_META[category];
  return {
    status: "ok",
    category,
    categoryLabelRu: meta.labelRu,
    malignancyRiskRu: meta.malignancyRiskRu,
    highRiskFeatures: highRisk,
    notAssessed,
    rationaleRu,
    management: manageEuNodule(category, input, profile),
    warnings,
    classificationSource: EU_SOURCES.EU_TIRADS_2017,
    engineVersion: EU_TIRADS_ENGINE_VERSION,
  };
}

/**
 * EU-TIRADS: 1 no nodule · 2 pure cyst / entirely spongiform · 3 iso/hyperechoic without high-suspicion
 * features · 4 mildly hypoechoic without high-suspicion features · 5 at least one high-suspicion feature
 * (non-oval shape, irregular margins, microcalcifications, marked hypoechogenicity).
 */
export function evaluateEuTirads(input: EuTiradsInput, profile: EuPolicyProfile): EuTiradsResult {
  const errors = validateEuTiradsInput(input);
  if (errors.length > 0) return { status: "invalid", errors };

  if (input.composition === undefined) {
    return { status: "incomplete", missing: ["composition"], messageRu: "Укажите состав узла (или «узлов нет»)." };
  }

  if (input.composition === "no_nodule") {
    return ok(1, input, profile, [], [], ["Узлов нет → EU-TIRADS 1."]);
  }
  if (input.composition === "pure_cyst") {
    return ok(2, input, profile, [], [], ["Чистая киста → EU-TIRADS 2."]);
  }
  if (input.composition === "entirely_spongiform") {
    return ok(2, input, profile, [], [], ["Полностью губчатый узел → EU-TIRADS 2."]);
  }

  const highRisk = highRiskFeaturesOf(input);
  const missing = SOLID_FEATURE_FIELDS.filter((f) => input[f] === undefined);

  if (highRisk.length > 0) {
    return ok(5, input, profile, highRisk, missing, [
      `Признаки высокой подозрительности: ${highRisk.map((f) => HIGH_RISK_LABEL_RU[f]).join(", ")} → EU-TIRADS 5.`,
      "Для категории 5 достаточно хотя бы одного признака; число признаков категорию не меняет.",
    ]);
  }

  if (missing.length > 0) {
    return {
      status: "incomplete",
      missing,
      messageRu: "Для категорий 3–4 нужно оценить эхогенность, форму, контуры и микрокальцинаты.",
    };
  }

  const noHighRisk = "Признаков высокой подозрительности нет.";
  if (input.echogenicity === "mildly_hypoechoic") {
    return ok(4, input, profile, [], [], [noHighRisk, "Умеренно гипоэхогенный солидный компонент → EU-TIRADS 4."]);
  }
  return ok(3, input, profile, [], [], [noHighRisk, "Изо- / гиперэхогенный солидный компонент → EU-TIRADS 3."]);
}
