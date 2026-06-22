import { calculateOradsResult } from "./calculateOradsResult";
import { getOradsDecisionNode, ORADS_TREE_ROOT_ID } from "./oradsDecisionTree";
import type { OradsExtractedInput } from "./parseOradsProtocolText";
import { parseOradsProtocolText } from "./parseOradsProtocolText";
import type { OradsTreePathStep } from "./types";
import { walkOradsDecisionTree } from "./treeWalker";

export type { OradsExtractedInput, OradsVascularity, OradsSeptations, OradsAscites, OradsContour } from "./parseOradsProtocolText";
export { parseOradsProtocolText };

export type HintConfidence = "low" | "medium" | "high";

export type OradsWizardHint = {
  nodeId: string;
  optionId: string;
  confidence: HintConfidence;
  source?: string;
};

export type OradsHintsResult = {
  extracted: OradsExtractedInput;
  hints: OradsWizardHint[];
  completePath: OradsTreePathStep[] | null;
  unresolvedNodes: string[];
  /** When true, apply ascites modifier after base result (O-RADS 5). */
  ascitesModifierSuggested: boolean;
  /** Deterministic category when completePath resolves. */
  categoryNumber: number | null;
};

type HintBuilder = {
  hints: OradsWizardHint[];
  unresolved: string[];
};

function addHint(
  b: HintBuilder,
  nodeId: string,
  optionId: string,
  confidence: HintConfidence,
  source?: string,
): void {
  if (b.hints.some((h) => h.nodeId === nodeId)) return;
  b.hints.push({ nodeId, optionId, confidence, source });
}

function cm(diameterMm?: number): number | undefined {
  if (diameterMm === undefined) return undefined;
  return diameterMm / 10;
}

function vascularityToColorScore(v?: OradsExtractedInput["vascularity"]): "cs12" | "cs34" | "cs1" | "cs23" | "cs4" | null {
  switch (v) {
    case "none":
      return "cs12";
    case "low":
      return "cs12";
    case "moderate":
      return "cs23";
    case "high":
      return "cs34";
    default:
      return null;
  }
}

function pickSimpleSizeOption(input: OradsExtractedInput): { optionId: string; confidence: HintConfidence } | null {
  const d = cm(input.diameterMm);
  const meno = input.menopause ?? "pre";
  if (d === undefined) return null;

  if (meno === "post") {
    if (d <= 3) return { optionId: "post_le3", confidence: input.menopause ? "high" : "medium" };
    if (d <= 5) return { optionId: "post_gt3_le5", confidence: input.menopause ? "high" : "medium" };
    return { optionId: "post_gt5", confidence: input.menopause ? "high" : "medium" };
  }

  if (d <= 3) return { optionId: "pre_le3", confidence: input.menopause ? "high" : "medium" };
  if (d <= 5) return { optionId: "pre_gt3_le5", confidence: input.menopause ? "high" : "medium" };
  if (d < 10) return { optionId: "pre_gt5_lt10", confidence: input.menopause ? "high" : "medium" };
  return { optionId: "pre_ge10", confidence: input.menopause ? "high" : "medium" };
}

function buildLesionPath(input: OradsExtractedInput, b: HintBuilder): void {
  if (input.noFocalLesion || input.lesionClass === "normal") {
    addHint(b, "step2_lesion_class", "normal", "high", "без образований");
    return;
  }

  if (input.lesionClass === "solid" || input.structure === "solid") {
    addHint(b, "step2_lesion_class", "solid", "high", "солидное образование");
    const contour = input.contour ?? "smooth";
    addHint(
      b,
      "step4_solid_dominant_contour",
      contour === "irregular" ? "irregular" : "smooth",
      input.contour ? "high" : "medium",
      input.contour,
    );
    if (contour === "smooth") {
      addHint(b, "step4_solid_shadowing", "without", "low");
      const cs = vascularityToColorScore(input.vascularity);
      if (cs === "cs1") addHint(b, "step5_dominant_solid_cs", "cs1", "medium");
      else if (cs === "cs23") addHint(b, "step5_dominant_solid_cs", "cs23", input.vascularity ? "high" : "medium");
      else if (cs === "cs34" || cs === "cs4")
        addHint(b, "step5_dominant_solid_cs", "cs4", input.vascularity ? "high" : "medium");
      else b.unresolved.push("step5_dominant_solid_cs");
    }
    return;
  }

  if (input.lesionClass === "simple" || (input.structure === "cystic" && input.septations === "none")) {
    addHint(b, "step2_lesion_class", "simple", "high", "простая киста");
    const wall =
      input.contour === "irregular" || input.echogenicity === "heterogeneous" ? "atypical" : "typical";
    addHint(
      b,
      "step3_simple_wall",
      wall,
      input.contour || input.echogenicity ? "high" : "medium",
    );
    const sizePick = pickSimpleSizeOption(input);
    if (sizePick) {
      addHint(b, "step3_simple_size", sizePick.optionId, sizePick.confidence);
      if (sizePick.optionId === "pre_le3") {
        addHint(b, "step3_simple_size_pre_le3", "cyst", "medium");
      }
    } else {
      b.unresolved.push("step3_simple_size");
    }
    return;
  }

  // Non-simple / complex
  addHint(b, "step2_lesion_class", "nonsimple", "high", "сложное образование");

  const loc =
    input.locularity ??
    (input.septations && input.septations !== "none" ? "multilocular" : "unilocular");
  addHint(
    b,
    "step3_locularity",
    loc === "multilocular" ? "multilocular" : loc === "bilocular" ? "bilocular" : "unilocular",
    input.locularity ? "high" : "medium",
  );

  if (loc === "unilocular") {
    const wall = input.contour === "irregular" ? "irregular" : "smooth";
    addHint(b, "step3_unilocular_wall", wall, input.contour ? "high" : "medium");

    if (wall === "irregular") {
      const solidH = input.solidComponentMm ?? (input.solidComponent ? 3 : undefined);
      addHint(
        b,
        "step3_unilocular_irregular_nodule",
        solidH !== undefined && solidH >= 3 ? "ge3mm" : "lt3mm",
        input.solidComponentMm ? "high" : "medium",
      );
      return;
    }

    const classic =
      input.echogenicity === "anechoic" && input.septations === "none" && !input.solidComponent
        ? "classic"
        : "non_classic";
    addHint(b, "step3_unilocular_classic", classic, classic === "classic" ? "high" : "medium");

    if (classic === "classic") {
      const d = cm(input.diameterMm);
      addHint(
        b,
        "step3_classic_size",
        d !== undefined && d >= 10 ? "ge10" : "lt10",
        input.diameterMm ? "high" : "medium",
      );
      return;
    }

    const d = cm(input.diameterMm);
    addHint(
      b,
      "step3_unilocular_nonsimple_size",
      d !== undefined && d >= 10 ? "ge10" : "lt10",
      input.diameterMm ? "high" : "medium",
    );

    if (input.solidComponent === false) {
      addHint(b, "step4_solid_presence", "absent", "high");
    } else if (input.solidComponent) {
      addHint(b, "step4_solid_presence", "present", "high");
      const h = input.solidComponentMm ?? 3;
      addHint(b, "step4_solid_height", h >= 3 ? "ge3mm" : "lt3mm", input.solidComponentMm ? "high" : "medium");
      addHint(b, "step4_papillary_count", "lt4", "low");
      addHint(
        b,
        "step4_solid_contour",
        input.contour === "irregular" ? "irregular" : "smooth",
        input.contour ? "high" : "medium",
      );
      const cs = vascularityToColorScore(input.vascularity);
      if (cs) addHint(b, "step5_cystic_solid_cs", cs, input.vascularity ? "high" : "medium");
      else b.unresolved.push("step5_cystic_solid_cs");
    } else {
      b.unresolved.push("step4_solid_presence");
    }
    return;
  }

  if (loc === "bilocular") {
    const wall = input.contour === "irregular" ? "irregular" : "smooth";
    addHint(b, "step3_bilocular_wall", wall, input.contour ? "high" : "medium");
    if (wall === "irregular") return;
    const d = cm(input.diameterMm);
    if (d === undefined) {
      b.unresolved.push("step3_bilocular_size");
      return;
    }
    if (d <= 3) addHint(b, "step3_bilocular_size", "le3", "high");
    else if (d < 10) addHint(b, "step3_bilocular_size", "gt3_lt10", "high");
    else addHint(b, "step3_bilocular_size", "ge10", "high");
    return;
  }

  // Multilocular
  const wall =
    input.contour === "irregular" || input.septations === "thick" ? "irregular" : "smooth";
  addHint(
    b,
    "step3_multilocular_wall",
    wall,
    input.contour || input.septations ? "high" : "medium",
  );

  const gateNode =
    wall === "irregular" ? "step3_multilocular_irregular_solid_gate" : "step3_multilocular_solid_gate";

  if (input.solidComponent === true || (input.solidComponentMm !== undefined && input.solidComponentMm >= 3)) {
    addHint(b, gateNode, "with_solid", "high", "солидный компонент");
    const cs = vascularityToColorScore(input.vascularity);
    if (cs) addHint(b, "step5_multilocular_solid_cs", cs, input.vascularity ? "high" : "medium");
    else b.unresolved.push("step5_multilocular_solid_cs");
  } else if (input.solidComponent === false) {
    addHint(b, gateNode, "no_solid", "high");
    const d = cm(input.diameterMm);
    if (d === undefined) {
      b.unresolved.push("step3_multilocular_size");
      return;
    }
    if (d < 10) addHint(b, "step3_multilocular_size", "lt10", "high");
    else if (input.vascularity === "high")
      addHint(b, "step3_multilocular_size", "any_cs4", "medium");
    else addHint(b, "step3_multilocular_size", "ge10_cs_lt4", "medium");
  } else {
    b.unresolved.push(gateNode);
  }
}

/** Validate hints form a contiguous path through the decision tree. */
export function hintsToPath(hints: OradsWizardHint[]): OradsTreePathStep[] | null {
  const steps: OradsTreePathStep[] = [];
  let nodeId = ORADS_TREE_ROOT_ID;

  for (const hint of hints) {
    const node = getOradsDecisionNode(nodeId);
    if (!node || node.id !== hint.nodeId) {
      // Allow hints that start mid-path if first hint matches current node
      const hintNode = getOradsDecisionNode(hint.nodeId);
      if (!hintNode || steps.length > 0) return null;
      nodeId = hint.nodeId;
    }

    const current = getOradsDecisionNode(nodeId);
    if (!current) return null;
    const option = current.options.find((o) => o.id === hint.optionId);
    if (!option) return null;

    steps.push({ nodeId: current.id, optionId: hint.optionId });

    if (option.result) return steps;
    if (!option.next) return null;
    nodeId = option.next;
  }

  const walked = walkOradsDecisionTree(steps);
  return walked.ok ? steps : null;
}

export function mapExtractedToHints(input: OradsExtractedInput): OradsHintsResult {
  const b: HintBuilder = { hints: [], unresolved: [] };

  if (input.localization === "extraovarian") {
    addHint(b, "step1_localization", "extraovarian", "high");
    b.unresolved.push("step1_extraovarian");
  } else {
    addHint(b, "step1_localization", "ovarian", /яичник/.test(input.sourceText ?? "") ? "high" : "medium");
  }

  if (input.menopause) {
    addHint(b, "step2_menopause", input.menopause, "high");
  } else {
    addHint(b, "step2_menopause", "pre", "low", "менопауза не указана — пременопауза по умолчанию");
    b.unresolved.push("step2_menopause");
  }

  if (input.localization !== "extraovarian") {
    buildLesionPath(input, b);
  }

  const completePath = hintsToPath(b.hints);
  let categoryNumber: number | null = null;
  if (completePath) {
    const calc = calculateOradsResult(completePath);
    if (calc.ok) categoryNumber = calc.result.categoryNumber;
  }

  const ascitesModifierSuggested =
    input.ascites === "present" && categoryNumber !== null && categoryNumber < 5;

  return {
    extracted: input,
    hints: b.hints,
    completePath,
    unresolvedNodes: [...new Set(b.unresolved)],
    ascitesModifierSuggested,
    categoryNumber,
  };
}

/** Parse free text and map to wizard hints in one call. */
export function parseAndMapOradsHints(
  text: string,
  overrides?: Pick<OradsExtractedInput, "menopause" | "ageYears">,
): OradsHintsResult {
  const extracted = parseOradsProtocolText(text);
  if (overrides?.menopause) extracted.menopause = overrides.menopause;
  if (overrides?.ageYears) extracted.ageYears = overrides.ageYears;
  return mapExtractedToHints(extracted);
}
