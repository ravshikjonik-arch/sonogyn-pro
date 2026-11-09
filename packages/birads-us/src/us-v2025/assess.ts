import {
  BIRADS_ASSOCIATED_OPTIONS,
  BIRADS_CALC_OPTIONS,
  BIRADS_CATEGORY_INFO,
  BIRADS_ECHO_OPTIONS,
  BIRADS_KIND_OPTIONS,
  BIRADS_MARGIN_OPTIONS,
  BIRADS_NML_DISTRIBUTION_OPTIONS,
  BIRADS_NML_ECHO_OPTIONS,
  BIRADS_ORIENTATION_OPTIONS,
  BIRADS_POSTERIOR_OPTIONS,
  BIRADS_SHAPE_OPTIONS,
  BIRADS_SPECIAL_CASE_OPTIONS,
  BIRADS_SUSPICIOUS_LABEL_RU,
  BIRADS_US_ENGINE_VERSION,
  BIRADS_US_SOURCES,
  BIRADS_VASCULARITY_OPTIONS,
  type BiradsOption,
} from "./lexicon";
import type {
  BiradsCategory,
  BiradsPathway,
  BiradsSpecialCase,
  BiradsSuspiciousFeature,
  BiradsUsField,
  BiradsUsLesionInput,
  BiradsUsLesionResult,
} from "./types";

export const BIRADS_FIELD_LABEL_RU: Record<BiradsUsField, string> = {
  kind: "тип находки",
  shape: "форма",
  orientation: "ориентация",
  margin: "контур",
  echoPattern: "эхоструктура",
  posterior: "задние акустические признаки",
  nmlDistribution: "распределение",
  nmlEcho: "эхогенность NML",
  nmlPosterior: "задние признаки NML",
  specialCase: "особый случай",
  calcifications: "кальцинаты",
  associated: "сопутствующие признаки",
};

const ALL_CATEGORIES: BiradsCategory[] = ["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"];
const SUSPICIOUS_OPTIONS: BiradsCategory[] = ["4A", "4B", "4C", "5"];

const BENIGN_SPECIAL: BiradsSpecialCase[] = [
  "simple_cyst",
  "intramammary_lymph_node",
  "postsurgical_fluid",
  "implant_or_foreign_body",
];
const PROBABLY_BENIGN_SPECIAL: BiradsSpecialCase[] = ["isolated_complicated_cyst", "clustered_microcysts"];

type Errors = { field: keyof BiradsUsLesionInput; messageRu: string }[];

function checkEnum<T extends string>(errors: Errors, field: keyof BiradsUsLesionInput, value: unknown, options: BiradsOption<T>[]) {
  if (value === undefined) return;
  if (!options.some((o) => o.value === value)) errors.push({ field, messageRu: `Недопустимое значение поля «${String(field)}».` });
}

export function validateBiradsUsLesion(input: BiradsUsLesionInput): Errors {
  const errors: Errors = [];
  checkEnum(errors, "kind", input.kind, BIRADS_KIND_OPTIONS);
  checkEnum(errors, "shape", input.shape, BIRADS_SHAPE_OPTIONS);
  checkEnum(errors, "orientation", input.orientation, BIRADS_ORIENTATION_OPTIONS);
  checkEnum(errors, "margin", input.margin, BIRADS_MARGIN_OPTIONS);
  checkEnum(errors, "echoPattern", input.echoPattern, BIRADS_ECHO_OPTIONS);
  checkEnum(errors, "posterior", input.posterior, BIRADS_POSTERIOR_OPTIONS);
  checkEnum(errors, "nmlDistribution", input.nmlDistribution, BIRADS_NML_DISTRIBUTION_OPTIONS);
  checkEnum(errors, "nmlEcho", input.nmlEcho, BIRADS_NML_ECHO_OPTIONS);
  checkEnum(errors, "nmlPosterior", input.nmlPosterior, BIRADS_POSTERIOR_OPTIONS);
  checkEnum(errors, "specialCase", input.specialCase, BIRADS_SPECIAL_CASE_OPTIONS);
  checkEnum(errors, "calcifications", input.calcifications, BIRADS_CALC_OPTIONS);
  checkEnum(errors, "vascularity", input.vascularity, BIRADS_VASCULARITY_OPTIONS);
  if (input.associated !== undefined) {
    if (!Array.isArray(input.associated) || input.associated.some((a) => !BIRADS_ASSOCIATED_OPTIONS.some((o) => o.value === a))) {
      errors.push({ field: "associated", messageRu: "Недопустимое значение сопутствующих признаков." });
    } else if (input.associated.includes("none") && input.associated.length > 1) {
      errors.push({ field: "associated", messageRu: "«Сопутствующих признаков нет» нельзя сочетать с другими признаками." });
    }
  }
  if (input.doctorCategory !== undefined && !ALL_CATEGORIES.includes(input.doctorCategory)) {
    errors.push({ field: "doctorCategory", messageRu: "Недопустимая категория BI-RADS." });
  }
  return errors;
}

function suspiciousFeaturesOf(input: BiradsUsLesionInput): BiradsSuspiciousFeature[] {
  const out: BiradsSuspiciousFeature[] = [];
  if (input.kind === "mass") {
    if (input.shape === "irregular") out.push("irregular_shape");
    if (input.orientation === "non_parallel") out.push("non_parallel");
    if (input.margin && input.margin !== "circumscribed") out.push("non_circumscribed_margin");
    if (input.echoPattern === "mixed_solid_cystic") out.push("mixed_solid_cystic");
  }
  if (input.calcifications === "micro") out.push("microcalcifications");
  const assoc = input.associated ?? [];
  if (assoc.includes("architectural_distortion")) out.push("architectural_distortion");
  if (assoc.includes("duct_changes")) out.push("duct_changes");
  if (assoc.includes("skin_retraction")) out.push("skin_retraction");
  return out;
}

function missingFields(input: BiradsUsLesionInput): BiradsUsField[] {
  const req: BiradsUsField[] =
    input.kind === "mass"
      ? ["shape", "orientation", "margin", "echoPattern", "posterior", "calcifications", "associated"]
      : input.kind === "non_mass"
        ? ["nmlDistribution", "nmlEcho", "nmlPosterior", "calcifications", "associated"]
        : ["specialCase"];
  return req.filter((f) => (f === "associated" ? !input.associated?.length : input[f] === undefined));
}

function category3Blockers(input: BiradsUsLesionInput): string[] {
  const out: string[] = [];
  if (input.shape === "lobulated") out.push("дольчатая форма (v2025): критерии категории 3 описаны для овальной формы");
  if (input.shape === "round") out.push("округлая форма");
  if (input.echoPattern === "anechoic") out.push("анэхогенная структура — если это простая киста, оформите как особый случай");
  if (input.posterior === "shadowing") out.push("акустическая тень");
  const assoc = input.associated ?? [];
  if (assoc.includes("echogenic_rind")) out.push("эхогенный ободок");
  if (assoc.includes("skin_thickening")) out.push("утолщение кожи");
  if (assoc.includes("edema")) out.push("отёк");
  return out;
}

function pathwayFor(input: BiradsUsLesionInput, suspicious: BiradsSuspiciousFeature[], blockers: string[]): BiradsPathway {
  if (input.kind === "special_case" && input.specialCase) {
    if (BENIGN_SPECIAL.includes(input.specialCase)) {
      return { kind: "determined", category: "2", reasonRu: "Типичная доброкачественная находка (ACR: категория 2)." };
    }
    if (PROBABLY_BENIGN_SPECIAL.includes(input.specialCase)) {
      return {
        kind: "determined",
        category: "3",
        reasonRu: "ACR: одиночная осложнённая киста и сгруппированные микрокисты — вероятно доброкачественные (категория 3).",
      };
    }
  }
  if (suspicious.length > 0) {
    return {
      kind: "needs_doctor",
      options: SUSPICIOUS_OPTIONS,
      reasonRu: `Есть подозрительные признаки: ${suspicious.map((f) => BIRADS_SUSPICIOUS_LABEL_RU[f]).join(", ")}. Категория ≥ BI-RADS 4 — подкатегорию 4A/4B/4C или 5 выбирает врач.`,
    };
  }
  if (input.kind === "non_mass") {
    return {
      kind: "needs_doctor",
      options: ["2", "3", ...SUSPICIOUS_OPTIONS],
      reasonRu: "Non-mass изменение (v2025): категорию определяет врач по совокупности признаков и данным других методов.",
    };
  }
  if (blockers.length > 0) {
    const onlyLobulated = blockers.length === 1 && input.shape === "lobulated";
    return {
      kind: "needs_doctor",
      options: onlyLobulated ? ["3", "4A"] : ["2", "3", ...SUSPICIOUS_OPTIONS],
      reasonRu: `Подозрительных признаков нет, но критерии категории 3 не выполнены: ${blockers.join("; ")}. Категорию выбирает врач.`,
    };
  }
  return {
    kind: "determined",
    category: "3",
    reasonRu: "Критерии ACR категории 3: солидное образование овальной формы, с чётким контуром и параллельной ориентацией, без подозрительных признаков.",
  };
}

export function assessBiradsUsLesion(input: BiradsUsLesionInput): BiradsUsLesionResult {
  const errors = validateBiradsUsLesion(input);
  if (errors.length > 0) return { status: "invalid", errors };

  const notesRu: string[] = [];
  if (input.kind === undefined) {
    if (input.doctorCategory) {
      return {
        status: "ok",
        pathway: { kind: "needs_doctor", options: ALL_CATEGORIES, reasonRu: "Находка не описана — категория указана врачом." },
        suspiciousFeatures: [],
        category3Blockers: [],
        final: BIRADS_CATEGORY_INFO[input.doctorCategory],
        finalSource: "doctor",
        notesRu,
        source: BIRADS_US_SOURCES.ACR_BIRADS_V2025,
        engineVersion: BIRADS_US_ENGINE_VERSION,
      };
    }
    return { status: "incomplete", missing: ["kind"], messageRu: "Выберите тип находки: образование, non-mass или особый случай." };
  }

  const suspicious = suspiciousFeaturesOf(input);
  const missing = missingFields(input);
  if (suspicious.length === 0 && missing.length > 0) {
    return { status: "incomplete", missing, messageRu: "Опишите все признаки находки — без них категорию определить нельзя." };
  }
  if (missing.length > 0) {
    notesRu.push(`Не описаны: ${missing.map((f) => BIRADS_FIELD_LABEL_RU[f]).join(", ")}. Категорию ≥ 4 это не меняет, но для протокола их стоит описать.`);
  }

  const blockers = input.kind === "mass" ? category3Blockers(input) : [];
  const pathway = pathwayFor(input, suspicious, blockers);

  if (pathway.kind === "determined" && pathway.category === "3" && input.stableOnPriors) {
    notesRu.push("Стабильно 2–3 года по предыдущим снимкам: ACR допускает описание как категории 2 — решение врача.");
  }
  if (input.vascularity === "internal") {
    notesRu.push("Внутренний кровоток сам по себе категорию не определяет — оценивается вместе с остальными признаками.");
  }

  let final = null;
  let finalSource: "doctor" | "engine" | null = null;
  if (input.doctorCategory) {
    final = BIRADS_CATEGORY_INFO[input.doctorCategory];
    finalSource = "doctor";
    const expected = pathway.kind === "determined" ? [pathway.category] : pathway.options;
    if (!expected.includes(input.doctorCategory)) {
      notesRu.push(`Выбор врача (BI-RADS ${input.doctorCategory}) отличается от расчётного пути (${expected.map((c) => `BI-RADS ${c}`).join(" / ")}). Расчёт сохранён для протокола.`);
    }
  } else if (pathway.kind === "determined") {
    final = BIRADS_CATEGORY_INFO[pathway.category];
    finalSource = "engine";
  }

  return {
    status: "ok",
    pathway,
    suspiciousFeatures: suspicious,
    category3Blockers: blockers,
    final,
    finalSource,
    notesRu,
    source: BIRADS_US_SOURCES.ACR_BIRADS_V2025,
    engineVersion: BIRADS_US_ENGINE_VERSION,
  };
}
