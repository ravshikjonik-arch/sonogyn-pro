import {
  COMPOSITION_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  ECHOGENICITY_OPTIONS,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  type LexiconOption,
} from "./lexicon";
import { ACR_TIRADS_ENGINE_VERSION, evaluateAcrTirads } from "./score";
import type { LymphNodeAssessment, TiradsAcrInput, TiradsAcrResult, TiradsEchogenicFoci } from "./types";

export const ACR_TIRADS_SOURCE = {
  id: "ACR_TIRADS_2017",
  citation:
    "Tessler F.N. et al. ACR Thyroid Imaging, Reporting and Data System (TI-RADS): White Paper of the ACR TI-RADS Committee. J Am Coll Radiol. 2017;14(5):587–595.",
  version: "2017",
} as const;

type AcrFeatureField = "composition" | "echogenicity" | "shape" | "margin" | "echogenicFoci";

/** Every field optional: a missing answer is reported, never scored as 0 points. */
export type AcrStrictInput = Partial<Omit<TiradsAcrInput, "echogenicFoci">> & {
  echogenicFoci?: TiradsEchogenicFoci[];
  isPediatric?: boolean;
};

export type AcrStrictWarning = { code: "extrathyroidal_extension" | "pediatric" | "suspicious_lymph_nodes"; messageRu: string };

export type AcrStrictManagement = {
  fna: "indicated" | "not_indicated" | "undetermined";
  fnaReasonRu: string;
  followUpRu: string | null;
};

export type AcrStrictResult =
  | { status: "invalid"; errors: { field: keyof AcrStrictInput; messageRu: string }[] }
  | { status: "incomplete"; missing: AcrFeatureField[]; messageRu: string }
  | {
      status: "ok";
      result: TiradsAcrResult;
      management: AcrStrictManagement;
      warnings: AcrStrictWarning[];
      source: typeof ACR_TIRADS_SOURCE;
      engineVersion: string;
    };

const LYMPH_NODE_VALUES: LymphNodeAssessment[] = ["not_assessed", "benign", "indeterminate", "suspicious"];
const MAX_PLAUSIBLE_DIAMETER_MM = 200;

function isOption<T extends string>(options: LexiconOption<T>[], value: unknown): value is T {
  return options.some((o) => o.value === value);
}

function validate(input: AcrStrictInput) {
  const errors: { field: keyof AcrStrictInput; messageRu: string }[] = [];
  const bad = (field: keyof AcrStrictInput) =>
    errors.push({ field, messageRu: `Недопустимое значение поля «${String(field)}».` });

  if (input.composition !== undefined && !isOption(COMPOSITION_OPTIONS, input.composition)) bad("composition");
  if (input.echogenicity !== undefined && !isOption(ECHOGENICITY_OPTIONS, input.echogenicity)) bad("echogenicity");
  if (input.shape !== undefined && !isOption(SHAPE_OPTIONS, input.shape)) bad("shape");
  if (input.margin !== undefined && !isOption(MARGIN_OPTIONS, input.margin)) bad("margin");
  if (input.echogenicFoci !== undefined) {
    if (!Array.isArray(input.echogenicFoci) || input.echogenicFoci.some((f) => !isOption(ECHOGENIC_FOCI_OPTIONS, f))) {
      bad("echogenicFoci");
    }
  }
  if (input.lymphNodes !== undefined && !LYMPH_NODE_VALUES.includes(input.lymphNodes)) bad("lymphNodes");
  if (input.largestDiameterMm !== undefined) {
    const s = input.largestDiameterMm;
    if (typeof s !== "number" || !Number.isFinite(s) || s <= 0) {
      errors.push({ field: "largestDiameterMm", messageRu: "Размер узла должен быть положительным числом (мм)." });
    } else if (s > MAX_PLAUSIBLE_DIAMETER_MM) {
      errors.push({ field: "largestDiameterMm", messageRu: `Размер больше ${MAX_PLAUSIBLE_DIAMETER_MM} мм — проверьте единицы (мм).` });
    }
  }
  return errors;
}

/**
 * ACR TI-RADS with explicit missing-data handling on top of `evaluateAcrTirads` (scoring unchanged).
 * Spongiform / no nodule need only composition (ACR: no further points); every other nodule needs all five groups.
 */
export function evaluateAcrTiradsStrict(input: AcrStrictInput): AcrStrictResult {
  const errors = validate(input);
  if (errors.length > 0) return { status: "invalid", errors };

  if (input.composition === undefined) {
    return { status: "incomplete", missing: ["composition"], messageRu: "Укажите состав узла (или «нет узла»)." };
  }

  const shortcut = input.composition === "spongiform" || input.composition === "no_nodule";
  if (!shortcut) {
    const missing: AcrFeatureField[] = [];
    if (input.echogenicity === undefined) missing.push("echogenicity");
    if (input.shape === undefined) missing.push("shape");
    if (input.margin === undefined) missing.push("margin");
    if (!input.echogenicFoci || input.echogenicFoci.length === 0) missing.push("echogenicFoci");
    if (missing.length > 0) {
      return {
        status: "incomplete",
        missing,
        messageRu: "ACR TI-RADS: выберите по одному признаку в каждой группе и все эхогенные включения.",
      };
    }
  }

  const { isPediatric, ...rest } = input;
  const engineInput: TiradsAcrInput = {
    ...rest,
    composition: input.composition,
    echogenicity: input.echogenicity ?? "anechoic",
    shape: input.shape ?? "wider_than_tall",
    margin: input.margin ?? "smooth",
    echogenicFoci: input.echogenicFoci?.length ? input.echogenicFoci : ["none_or_comet_tail"],
  };
  const result = evaluateAcrTirads(engineInput);

  const warnings: AcrStrictWarning[] = [];
  if (input.margin === "extrathyroidal_extension") {
    warnings.push({
      code: "extrathyroidal_extension",
      messageRu: "Экстратиреоидное распространение: нужна срочная оценка специалистом. Категория автоматически не меняется.",
    });
  }
  if (input.lymphNodes === "suspicious") {
    warnings.push({
      code: "suspicious_lymph_nodes",
      messageRu: "Подозрительные шейные лимфоузлы оцениваются отдельно от категории узла.",
    });
  }

  let management: AcrStrictManagement;
  const sizeKnown = input.largestDiameterMm !== undefined;
  if (isPediatric) {
    warnings.push({
      code: "pediatric",
      messageRu: "Пациент младше 18 лет: ACR TI-RADS разработана для взрослых, пороги FNA не применяются автоматически.",
    });
    management = {
      fna: "undetermined",
      fnaReasonRu: "Взрослые пороги ACR TI-RADS у ребёнка не применяются автоматически — решение врача.",
      followUpRu: null,
    };
  } else if (result.category === "TR1" || result.category === "TR2") {
    management = { fna: "not_indicated", fnaReasonRu: result.fnaRationale, followUpRu: result.followUpRecommendation };
  } else if (!sizeKnown) {
    management = {
      fna: "undetermined",
      fnaReasonRu: "Укажите наибольший размер узла — показания к FNA и наблюдению по ACR зависят от размера.",
      followUpRu: null,
    };
  } else {
    management = {
      fna: result.fnaRecommended ? "indicated" : "not_indicated",
      fnaReasonRu: result.fnaRationale,
      followUpRu: result.followUpRecommendation,
    };
  }

  return { status: "ok", result, management, warnings, source: ACR_TIRADS_SOURCE, engineVersion: ACR_TIRADS_ENGINE_VERSION };
}
