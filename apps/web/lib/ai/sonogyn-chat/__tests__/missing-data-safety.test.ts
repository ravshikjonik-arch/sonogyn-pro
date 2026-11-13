import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateBirads, type BiradsInput } from "@repo/birads-us";
import { calculateAdnex, calculateSimpleRulesRisk } from "@repo/iota-models";
import { calculateORADS, type OradsInput } from "@repo/orads-us/pro";
import { evaluateAcrTirads, type TiradsAcrInput } from "@repo/tirads-acr";

import {
  buildToolCompletionNotice,
  EMPTY_ANSWER_NOTICE,
  toolStatusLabel,
} from "@/lib/ai/sonogyn-chat/tool-results";
import { executeClinicalTool } from "@/lib/ai/sonogyn-chat/tools/execute";

/** Synthetic descriptors only — no patient data. */
const json = (v: unknown) => JSON.parse(JSON.stringify(v)) as Record<string, unknown>;
const omit = (obj: Record<string, unknown>, ...keys: string[]) =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
const FNA_KEYS = ["fnaRecommended", "fnaRationale", "followUpRecommendation", "observationRecommendation"];

const NONPHYS = { lesionKind: "nonphysiological" } as const;
const ASSESSED_NEGATIVES = { ascites: false, peritonealNodules: false, acousticShadows: false } as const;

describe("O-RADS — missing findings never lower the category", () => {
  const simpleCyst: OradsInput = {
    menopause: "pre",
    ...NONPHYS,
    structure: "unilocular",
    unilocularSubtype: "simple_cyst",
    lengthMm: 30,
    widthMm: 25,
    heightMm: 20,
  };

  it("solid component and wall contour not provided → incomplete, no category", () => {
    const out = executeClinicalTool("calculate_orads", simpleCyst);
    assert.equal(out.ok, false);
    assert.equal(out.status, "incomplete");
    assert.equal(out.result, undefined);
    assert.deepEqual(out.completeness?.category.assumedAbsent?.sort(), ["solidComponent", "solidType"]);
    assert.ok(out.completeness?.category.possibleOutcomes?.includes("O-RADS 4"));
    assert.match(out.error ?? "", /solidComponent → O-RADS 4/);
  });

  it("the same cyst with findings stated → complete, identical to the engine", () => {
    const input: OradsInput = { ...simpleCyst, solidComponent: false, solidType: "smooth", ...ASSESSED_NEGATIVES };
    const out = executeClinicalTool("calculate_orads", input);
    assert.equal(out.status, "complete");
    assert.deepEqual(out.result, json(calculateORADS(input)));
  });

  it("ascites not provided does not matter for O-RADS 1–2 (engine never upgrades them)", () => {
    const out = executeClinicalTool("calculate_orads", { ...simpleCyst, solidComponent: false, solidType: "smooth" });
    assert.equal(out.status, "complete");
  });

  it("O-RADS 3 lesion without ascites / peritoneal findings → provisional with possible 5", () => {
    const input: OradsInput = {
      menopause: "pre",
      ...NONPHYS,
      structure: "unilocular",
      solidComponent: false,
      solidType: "smooth",
      acousticShadows: false,
      lengthMm: 110,
      widthMm: 80,
      heightMm: 70,
    };
    const out = executeClinicalTool("calculate_orads", input);
    assert.equal(out.ok, true);
    assert.equal(out.status, "provisional");
    assert.deepEqual(out.result, json(calculateORADS(input)));
    assert.equal(out.result?.category, 3);
    assert.deepEqual(out.completeness?.category.possibleOutcomes, ["O-RADS 3", "O-RADS 5"]);
    assert.match(out.limitations?.[0] ?? "", /ascites → O-RADS 5/);
  });

  it("solid component present, papillae count not provided → incomplete (4 vs 5)", () => {
    const out = executeClinicalTool("calculate_orads", {
      menopause: "post",
      ageYears: 60,
      ...NONPHYS,
      structure: "unilocular",
      solidComponent: true,
      ...ASSESSED_NEGATIVES,
      lengthMm: 40,
      widthMm: 30,
      heightMm: 30,
    });
    assert.equal(out.status, "incomplete");
    assert.deepEqual(out.completeness?.category.possibleOutcomes, ["O-RADS 4", "O-RADS 5"]);
  });

  it("solid smooth lesion, shadowing not provided → provisional (engine reads 'no shadow' = higher)", () => {
    const input: OradsInput = {
      menopause: "pre",
      ...NONPHYS,
      structure: "solid",
      solidComponent: true,
      solidType: "smooth",
      iotaColorScore: "2",
      ascites: false,
      peritonealNodules: false,
      lengthMm: 40,
      widthMm: 30,
      heightMm: 30,
    };
    const out = executeClinicalTool("calculate_orads", input);
    assert.equal(out.status, "provisional");
    assert.equal(out.result?.category, 4);
    assert.deepEqual(out.completeness?.category.possibleOutcomes, ["O-RADS 3", "O-RADS 4"]);
  });

  it("postmenopausal haemorrhagic cyst without age → incomplete (late postmenopause needs reclassification)", () => {
    const input: OradsInput = {
      menopause: "post",
      ...NONPHYS,
      structure: "unilocular",
      unilocularSubtype: "hemorrhagic",
      lengthMm: 40,
      widthMm: 30,
      heightMm: 30,
    };
    const out = executeClinicalTool("calculate_orads", input);
    assert.equal(out.status, "incomplete");
    assert.ok(out.completeness?.category.possibleOutcomes?.includes("не рассчитывается"));
    const withAge = executeClinicalTool("calculate_orads", { ...input, ageYears: 51 });
    assert.equal(withAge.status, "complete");
    assert.deepEqual(withAge.result, json(calculateORADS({ ...input, ageYears: 51 })));
  });

  it("normal ovary: nothing to probe → complete", () => {
    const out = executeClinicalTool("calculate_orads", { menopause: "pre", lesionKind: "normal_ovary" });
    assert.equal(out.status, "complete");
  });

  it("missing findings are never echoed back as false", () => {
    const out = executeClinicalTool("calculate_orads", simpleCyst);
    for (const key of ["solidComponent", "ascites", "acousticShadows", "peritonealNodules", "solidType"]) {
      assert.equal(key in out.inputEcho, false, key);
    }
  });
});

describe("TI-RADS — category and recommendation have independent completeness", () => {
  const tr4: TiradsAcrInput = {
    composition: "solid",
    echogenicity: "hypoechoic",
    shape: "wider_than_tall",
    margin: "smooth",
    echogenicFoci: ["none_or_comet_tail"],
  };

  it("TR4 without size: category complete, FNA/follow-up incomplete and withheld", () => {
    const out = executeClinicalTool("calculate_tirads", { ...tr4, lymphNodes: "benign" });
    assert.equal(out.ok, true);
    assert.equal(out.completeness?.category.status, "complete");
    assert.equal(out.completeness?.recommendation?.status, "incomplete");
    assert.equal(out.status, "incomplete");
    assert.equal(out.result?.category, "TR4");
    for (const key of FNA_KEYS) assert.equal(key in (out.result ?? {}), false, key);
    assert.deepEqual(
      out.result,
      omit(json(evaluateAcrTirads({ ...tr4, lymphNodes: "benign" })), ...FNA_KEYS),
    );
  });

  it("TR2 without size: FNA decision does not depend on size → complete", () => {
    const input: TiradsAcrInput = { ...tr4, composition: "cystic", echogenicity: "hyperechoic_or_isoechoic", lymphNodes: "benign" };
    const out = executeClinicalTool("calculate_tirads", input);
    assert.equal(out.completeness?.recommendation?.status, "complete");
    assert.deepEqual(out.result, json(evaluateAcrTirads(input)));
  });

  it("lymph nodes not assessed → FNA=false is provisional, with visible limitation", () => {
    const out = executeClinicalTool("calculate_tirads", { ...tr4, largestDiameterMm: 8 });
    assert.equal(out.completeness?.recommendation?.status, "provisional");
    assert.equal(out.result?.fnaRecommended, false);
    assert.match(out.limitations?.[0] ?? "", /лимфоузлы не оценены/);
    const assessed = executeClinicalTool("calculate_tirads", { ...tr4, largestDiameterMm: 8, lymphNodes: "benign" });
    assert.equal(assessed.status, "complete");
    const explicitNa = executeClinicalTool("calculate_tirads", { ...tr4, largestDiameterMm: 8, lymphNodes: "not_assessed" });
    assert.equal(explicitNa.completeness?.recommendation?.status, "provisional");
  });

  it("suspicious lymph nodes without size: FNA=true is kept (size cannot negate it), follow-up withheld", () => {
    const out = executeClinicalTool("calculate_tirads", { ...tr4, lymphNodes: "suspicious" });
    assert.equal(out.result?.fnaRecommended, true);
    assert.equal("followUpRecommendation" in (out.result ?? {}), false);
    assert.equal(out.completeness?.recommendation?.status, "incomplete");
  });

  it("echogenic foci not assessed → category incomplete with possible range", () => {
    const out = executeClinicalTool("calculate_tirads", { ...tr4, echogenicFoci: "not_assessed", largestDiameterMm: 20 });
    assert.equal(out.ok, false);
    assert.equal(out.result, undefined);
    assert.deepEqual(out.completeness?.category.possibleOutcomes, ["TR4", "TR5"]);
  });

  it("spongiform: an unassessed descriptor cannot change TR1 → complete", () => {
    const out = executeClinicalTool("calculate_tirads", {
      ...tr4,
      composition: "spongiform",
      echogenicity: "not_assessed",
      lymphNodes: "benign",
    });
    assert.equal(out.status, "complete");
    assert.equal(out.result?.category, "TR1");
    assert.deepEqual(out.completeness?.category.notAssessed, ["echogenicity"]);
  });

  it("an absent descriptor is a validation error, not a default", () => {
    const { margin: _m, ...noMargin } = tr4;
    void _m;
    const out = executeClinicalTool("calculate_tirads", noMargin);
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /margin: обязательное поле/);
  });

  it("unknown foci value error names the value and the not_assessed option", () => {
    const out = executeClinicalTool("calculate_tirads", { ...tr4, echogenicFoci: ["microcalcifications"] });
    assert.match(out.error ?? "", /microcalcifications/);
    assert.match(out.error ?? "", /not_assessed/);
  });
});

describe("BI-RADS — not assessed and rule-gap handling", () => {
  const oval: BiradsInput = {
    findingType: "mass",
    shape: "oval",
    margin: "circumscribed",
    echoPattern: "hypoechoic",
    vascularity: "none",
    orientation: "parallel",
    posteriorFeatures: "none",
  };

  it("vascularity not assessed where it changes the result → incomplete", () => {
    const out = executeClinicalTool("calculate_birads", { ...oval, vascularity: "not_assessed" });
    assert.equal(out.ok, false);
    assert.equal(out.status, "incomplete");
    assert.ok((out.completeness?.category.possibleOutcomes?.length ?? 0) > 1);
  });

  it("vascularity not assessed where it cannot change the result → complete, identical to engine", () => {
    const spiculated = { ...oval, shape: "irregular", margin: "spiculated" };
    const out = executeClinicalTool("calculate_birads", { ...spiculated, vascularity: "not_assessed" });
    assert.equal(out.status, "complete");
    assert.deepEqual(out.result, json(evaluateBirads({ ...spiculated, vascularity: "none" })));
    assert.deepEqual(out.completeness?.category.notAssessed, ["vascularity"]);
  });

  it("combination not covered by the ruleset → incomplete, not shown as a computed BI-RADS 0", () => {
    const input = { ...oval, shape: "irregular", echoPattern: "anechoic" };
    const direct = evaluateBirads(input);
    assert.equal(direct.category, "BI-RADS 0");
    const out = executeClinicalTool("calculate_birads", input);
    assert.equal(out.ok, false);
    assert.equal(out.completeness?.category.reason, "no_matching_rule");
    assert.match(out.error ?? "", /не покрыто правилами/);
  });

  it("complete input keeps full parity", () => {
    const out = executeClinicalTool("calculate_birads", oval);
    assert.equal(out.status, "complete");
    assert.deepEqual(out.result, json(evaluateBirads(oval)));
  });
});

describe("IOTA models and FMF — incomplete parameter sets", () => {
  const adnex = {
    ageYears: 50,
    oncologyCenter: false,
    maxDiameterMm: 60,
    maxSolidDiameterMm: 20,
    moreThan10Locules: false,
    papillaryCount: 1 as const,
    acousticShadows: false,
    ascites: false,
  };

  it("ADNEX: a missing predictor is rejected (no default)", () => {
    const { ascites: _a, ...noAscites } = adnex;
    void _a;
    const out = executeClinicalTool("calculate_adnex", noAscites);
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /ascites: обязательное поле/);
  });

  it("ADNEX without CA-125: complete, the model choice is stated", () => {
    const out = executeClinicalTool("calculate_adnex", adnex);
    assert.equal(out.status, "complete");
    assert.equal(out.result?.usedCa125, false);
    assert.match(out.limitations?.[0] ?? "", /без CA-125/);
    const direct = calculateAdnex(adnex);
    assert.equal(out.result?.malignancyRisk, "errors" in direct ? undefined : direct.malignancyRisk);
  });

  it("LR2: a missing predictor is rejected", () => {
    const out = executeClinicalTool("calculate_lr2", {
      ageYears: 50,
      ascites: false,
      maxSolidDiameterMm: 10,
      irregularInternalWalls: false,
      acousticShadows: false,
    });
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /bloodFlowInSolidPapillary: обязательное поле/);
  });

  it("Simple Rules Risk: not-assessed features → incomplete with the engine's risk range", () => {
    const out = executeClinicalTool("calculate_srrisk", {
      oncologyCenter: false,
      benignFeatures: ["B4"],
      malignantFeatures: [],
      notAssessedFeatures: ["M3", "M4"],
    });
    assert.equal(out.ok, false);
    assert.equal(out.result, undefined);
    const lo = calculateSimpleRulesRisk({ oncologyCenter: false, benignFeatures: ["B4"], malignantFeatures: [] });
    const hi = calculateSimpleRulesRisk({ oncologyCenter: false, benignFeatures: ["B4"], malignantFeatures: ["M3", "M4"] });
    assert.ok(!("errors" in lo) && !("errors" in hi));
    assert.deepEqual(out.completeness?.category.possibleOutcomes, [
      `${(lo.malignancyRisk * 100).toFixed(1)}%–${(hi.malignancyRisk * 100).toFixed(1)}%`,
    ]);
  });

  it("Simple Rules Risk: a feature both present and not assessed is a contradiction", () => {
    const out = executeClinicalTool("calculate_srrisk", {
      oncologyCenter: false,
      benignFeatures: [],
      malignantFeatures: ["M1"],
      notAssessedFeatures: ["M1"],
    });
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /противоречие/);
  });

  it("Simple Rules Risk: empty lists are explicit 'assessed, none' and say so", () => {
    const out = executeClinicalTool("calculate_srrisk", { oncologyCenter: false, benignFeatures: [], malignantFeatures: [] });
    assert.equal(out.status, "complete");
    assert.match(out.limitations?.[0] ?? "", /все 10 признаков оценены/);
  });

  it("FMF: a provided value the engine could not evaluate → provisional, listed", () => {
    const out = executeClinicalTool("assess_fmf_screening", { crlMm: 60, ntMm: 2, sbpMmHg: 120 });
    assert.equal(out.status, "provisional");
    assert.deepEqual(out.completeness?.category.missing, ["sbpMmHg"]);
    assert.match(out.limitations?.[0] ?? "", /sbpMmHg/);
  });

  it("FMF: nothing evaluable (CRL outside the reference) → incomplete, no empty 'OK'", () => {
    const out = executeClinicalTool("assess_fmf_screening", { crlMm: 90 });
    assert.equal(out.ok, false);
    assert.equal(out.status, "incomplete");
    assert.equal(out.result, undefined);
  });

  it("FMF: complete set → complete", () => {
    const out = executeClinicalTool("assess_fmf_screening", { crlMm: 60, ntMm: 2, sbpMmHg: 120, dbpMmHg: 75 });
    assert.equal(out.status, "complete");
  });
});

describe("visibility of limitations", () => {
  const incompleteOrads = executeClinicalTool("calculate_orads", {
    menopause: "pre",
    lesionKind: "nonphysiological",
    structure: "unilocular",
    lengthMm: 30,
    widthMm: 20,
    heightMm: 20,
  });

  it("text claiming a category the tool did not complete gets a server notice", () => {
    const notice = buildToolCompletionNotice("Заключение: O-RADS 2.", [incompleteOrads]);
    assert.match(notice, /O-RADS не завершён/);
  });

  it("the notice comes from the structured status, whatever the text says (TASK 05.4)", () => {
    assert.match(buildToolCompletionNotice("Уточните наличие солидного компонента.", [incompleteOrads]), /O-RADS не завершён/);
  });

  it("only the latest result per tool counts (corrected call)", () => {
    const fixed = executeClinicalTool("calculate_orads", {
      menopause: "pre",
      lesionKind: "nonphysiological",
      structure: "unilocular",
      solidComponent: false,
      solidType: "smooth",
      lengthMm: 30,
      widthMm: 20,
      heightMm: 20,
    });
    assert.equal(fixed.status, "complete");
    const confirmed = { ...fixed, review: { required: true, state: "confirmed" as const } };
    assert.equal(buildToolCompletionNotice("O-RADS 1", [incompleteOrads, confirmed]), "");
    assert.match(buildToolCompletionNotice("O-RADS 1", [incompleteOrads, fixed]), /подтверждения входных данных врачом/);
  });

  it("TI-RADS: category stated while FNA undetermined → recommendation notice", () => {
    const tool = executeClinicalTool("calculate_tirads", {
      composition: "solid",
      echogenicity: "hypoechoic",
      shape: "wider_than_tall",
      margin: "smooth",
      echogenicFoci: ["none_or_comet_tail"],
      lymphNodes: "benign",
    });
    const notice = buildToolCompletionNotice("TR4, ТАБ не показана.", [tool]);
    assert.match(notice, /рекомендация не определена/);
    assert.equal(toolStatusLabel(tool).text, "Рекомендация: нужны данные");
  });

  it("empty answer with tool results gets an explicit notice", () => {
    assert.ok(buildToolCompletionNotice("", [incompleteOrads]).includes(EMPTY_ANSWER_NOTICE));
  });

  it("card labels are text, not colour only", () => {
    const noGate = { ...incompleteOrads, review: { required: false, state: "not_required" as const } };
    assert.deepEqual(toolStatusLabel(incompleteOrads), { text: "Нужны данные", tone: "warn" });
    assert.equal(toolStatusLabel({ ...noGate, ok: true, status: "provisional" }).text, "Предварительно");
    assert.equal(toolStatusLabel({ ...noGate, ok: true, status: "complete" }).text, "Готово");
    assert.equal(toolStatusLabel({ ...incompleteOrads, ok: true, status: "complete" }).text, "Ожидает подтверждения врачом");
    assert.equal(toolStatusLabel({ ...noGate, rejected: true }).text, "Вызов отклонён");
  });
});
