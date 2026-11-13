import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateBirads, type BiradsInput } from "@repo/birads-us";
import { assessFirstTrimesterScreening } from "@repo/fmf";
import {
  calculateAdnex,
  calculateLr2,
  calculateSimpleRulesRisk,
  compareIotaRiskWithOrads,
} from "@repo/iota-models";
import { calculateORADS, type OradsInput } from "@repo/orads-us/pro";
import { evaluateAcrTirads, type TiradsAcrInput } from "@repo/tirads-acr";

import { executeClinicalTool } from "@/lib/ai/sonogyn-chat/tools/execute";
import { validateToolCall } from "@/lib/ai/sonogyn-chat/tools/schemas";

const json = (v: unknown) => JSON.parse(JSON.stringify(v)) as Record<string, unknown>;

function omit<T extends object>(obj: T, ...keys: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}

function withoutToolAnnotations(result: Record<string, unknown> | undefined): Record<string, unknown> {
  return omit(result ?? {}, "disclaimer", "compareWithOrads");
}

/** Synthetic descriptors only — no patient data. */
const ORADS_PAPILLARY_POST: OradsInput = {
  menopause: "post",
  ageYears: 58,
  lesionKind: "nonphysiological",
  structure: "unilocular",
  solidComponent: true,
  solidType: "papillary",
  papillaryProjectionCount: "4plus",
  iotaColorScore: "2",
  ascites: false,
  peritonealNodules: false,
  acousticShadows: false,
  lengthMm: 60,
  widthMm: 50,
  heightMm: 45,
};

const ORADS_MULTILOC_CS4: OradsInput = {
  menopause: "pre",
  lesionKind: "nonphysiological",
  structure: "multilocular",
  solidComponent: true,
  iotaColorScore: "4",
  ascites: true,
  peritonealNodules: false,
  acousticShadows: false,
  lengthMm: 80,
  widthMm: 70,
  heightMm: 60,
};

const ORADS_ENDOMETRIOMA: OradsInput = {
  menopause: "pre",
  lesionKind: "nonphysiological",
  structure: "unilocular",
  unilocularSubtype: "endometrioma",
  solidComponent: false,
  ascites: false,
  peritonealNodules: false,
  acousticShadows: false,
  lengthMm: 40,
  widthMm: 35,
  heightMm: 30,
};

const ORADS_EXTRAOVARIAN: OradsInput = {
  menopause: "pre",
  localization: "extraovarian",
  lesionKind: "nonphysiological",
  structure: "unilocular",
  unilocularSubtype: "hydrosalpinx",
  lengthMm: 45,
  widthMm: 20,
  heightMm: 18,
};

const ORADS_INCOMPLETE_SEPTUM: OradsInput = {
  menopause: "pre",
  lesionKind: "nonphysiological",
  structure: "multilocular",
  incompleteSeptum: true,
  septaThickness: "thin",
  solidComponent: false,
  solidType: "smooth",
  ascites: false,
  peritonealNodules: false,
  acousticShadows: false,
  lengthMm: 40,
  widthMm: 30,
  heightMm: 30,
};

const TIRADS_TR4: TiradsAcrInput = {
  composition: "solid",
  echogenicity: "hypoechoic",
  shape: "wider_than_tall",
  margin: "smooth",
  echogenicFoci: ["none_or_comet_tail"],
};

const BIRADS_SPICULATED: BiradsInput = {
  findingType: "mass",
  shape: "irregular",
  margin: "spiculated",
  echoPattern: "hypoechoic",
  vascularity: "none",
  orientation: "parallel",
  posteriorFeatures: "shadowing",
};

describe("calculate_orads — input fidelity and parity", () => {
  for (const [label, input] of [
    ["papillary 4+ post", ORADS_PAPILLARY_POST],
    ["multilocular CS4 + ascites", ORADS_MULTILOC_CS4],
    ["endometrioma", ORADS_ENDOMETRIOMA],
    ["extraovarian hydrosalpinx", ORADS_EXTRAOVARIAN],
    ["incomplete septum reclassification", ORADS_INCOMPLETE_SEPTUM],
  ] as const) {
    it(`full result equals direct calculateORADS: ${label}`, () => {
      const out = executeClinicalTool("calculate_orads", input);
      assert.equal(out.ok, true, out.error);
      assert.deepEqual(out.result, json(calculateORADS(input)));
    });
  }

  it("papillary projections reach the engine (O-RADS 5, not 4)", () => {
    const out = executeClinicalTool("calculate_orads", ORADS_PAPILLARY_POST);
    assert.equal(calculateORADS(ORADS_PAPILLARY_POST).category, 5);
    assert.equal(out.result?.category, 5);
    assert.equal(out.inputEcho.solidType, "papillary");
    assert.equal(out.inputEcho.papillaryProjectionCount, "4plus");
  });

  it("color score and ascites reach the engine (O-RADS 5, not a placeholder 3)", () => {
    const out = executeClinicalTool("calculate_orads", ORADS_MULTILOC_CS4);
    assert.equal(out.result?.category, 5);
    assert.equal(out.inputEcho.iotaColorScore, "4");
    assert.equal(out.inputEcho.ascites, true);
  });

  it("papillae without solidComponent=true are rejected, not silently dropped", () => {
    const noSolid = omit(ORADS_PAPILLARY_POST, "solidComponent");
    const missing = executeClinicalTool("calculate_orads", noSolid);
    assert.equal(missing.ok, false);
    assert.match(missing.error ?? "", /solidComponent/);
    const contradicted = executeClinicalTool("calculate_orads", { ...ORADS_PAPILLARY_POST, solidComponent: false });
    assert.equal(contradicted.ok, false);
    assert.match(contradicted.error ?? "", /противоречие/);
  });

  it("engine placeholder (missing color score) is an explicit refusal, not O-RADS 3", () => {
    const noColor = omit(ORADS_MULTILOC_CS4, "iotaColorScore") as OradsInput;
    const direct = calculateORADS(noColor);
    assert.equal(direct.riskText, "Нужны данные для расчёта");
    const out = executeClinicalTool("calculate_orads", noColor);
    assert.equal(out.ok, false);
    assert.equal(out.result, undefined);
    assert.match(out.error ?? "", /не определена/);
    assert.match(out.error ?? "", /цветовую шкалу/);
  });

  it("absent boolean findings are reported, not echoed as false", () => {
    const input: OradsInput = {
      menopause: "pre",
      lesionKind: "nonphysiological",
      structure: "unilocular",
      unilocularSubtype: "simple_cyst",
      lengthMm: 30,
      widthMm: 25,
      heightMm: 20,
    };
    const out = executeClinicalTool("calculate_orads", input);
    assert.equal(out.ok, false);
    assert.equal(out.status, "incomplete");
    assert.equal(out.result, undefined);
    assert.deepEqual(out.notProvided, ["solidComponent", "ascites", "peritonealNodules", "acousticShadows"]);
    for (const key of out.notProvided ?? []) assert.equal(key in out.inputEcho, false);
  });

  it("explicitly assessed findings produce no notProvided warning", () => {
    const out = executeClinicalTool("calculate_orads", ORADS_ENDOMETRIOMA);
    assert.equal(out.notProvided, undefined);
    assert.equal(out.limitations, undefined);
  });
});

describe("calculate_tirads — size fidelity and parity", () => {
  it("largestDiameterMm reaches the FNA logic (TR4 18 mm → FNA)", () => {
    const input = { ...TIRADS_TR4, largestDiameterMm: 18 };
    const out = executeClinicalTool("calculate_tirads", input);
    const direct = evaluateAcrTirads(input);
    assert.equal(direct.fnaRecommended, true);
    assert.deepEqual(out.result, json(direct));
    assert.equal(out.result?.fnaRecommended, true);
    assert.equal(out.missingFields, undefined);
  });

  it("legacy maxDiameterMm alias is forwarded as largestDiameterMm (same unit)", () => {
    const out = executeClinicalTool("calculate_tirads", { ...TIRADS_TR4, maxDiameterMm: 18 });
    assert.deepEqual(out.result, json(evaluateAcrTirads({ ...TIRADS_TR4, largestDiameterMm: 18 })));
  });

  it("conflicting size fields are rejected", () => {
    const out = executeClinicalTool("calculate_tirads", { ...TIRADS_TR4, largestDiameterMm: 18, maxDiameterMm: 9 });
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /два разных размера/);
  });

  it("missing size is not treated as zero size", () => {
    const out = executeClinicalTool("calculate_tirads", TIRADS_TR4);
    assert.deepEqual(
      out.result,
      omit(json(evaluateAcrTirads(TIRADS_TR4)), "fnaRecommended", "fnaRationale", "followUpRecommendation", "observationRecommendation"),
    );
    assert.equal("fnaRecommended" in (out.result ?? {}), false);
    assert.deepEqual(out.missingFields, ["largestDiameterMm"]);
    assert.ok(out.notProvided?.includes("largestDiameterMm"));
    assert.ok(out.limitations?.[0]?.includes("не означает отсутствия показаний"));
    assert.equal("largestDiameterMm" in out.inputEcho, false);
    const zero = executeClinicalTool("calculate_tirads", { ...TIRADS_TR4, largestDiameterMm: 0 });
    assert.equal(zero.ok, false);
  });

  it("suspicious lymph nodes reach the engine (forced FNA)", () => {
    const input: TiradsAcrInput = { ...TIRADS_TR4, largestDiameterMm: 8, lymphNodes: "suspicious" };
    const out = executeClinicalTool("calculate_tirads", input);
    assert.equal(out.result?.fnaRecommended, true);
    assert.deepEqual(out.result, json(evaluateAcrTirads(input)));
  });

  it("multiple echogenic foci are summed exactly like the engine", () => {
    const input: TiradsAcrInput = {
      ...TIRADS_TR4,
      echogenicFoci: ["macrocalcifications", "punctate"],
      largestDiameterMm: 12,
    };
    const out = executeClinicalTool("calculate_tirads", input);
    assert.deepEqual(out.result, json(evaluateAcrTirads(input)));
    assert.equal(out.result?.category, "TR5");
  });

  it("unknown lexicon value is rejected instead of scoring 0 points", () => {
    const out = executeClinicalTool("calculate_tirads", { ...TIRADS_TR4, echogenicFoci: ["microcalcifications"] });
    assert.equal(out.ok, false);
    assert.equal(out.tool, "calculate_tirads");
    assert.match(out.error ?? "", /microcalcifications/);
    assert.match(out.error ?? "", /punctate/);
  });
});

describe("calculate_birads — parity and strict lexicon", () => {
  it("full result equals direct evaluateBirads", () => {
    const out = executeClinicalTool("calculate_birads", BIRADS_SPICULATED);
    assert.equal(out.ok, true);
    assert.deepEqual(out.result, json(evaluateBirads(BIRADS_SPICULATED)));
  });

  it("non-mass descriptors are forwarded, not stripped", () => {
    const input: BiradsInput = {
      ...BIRADS_SPICULATED,
      findingType: "non_mass",
      nonMassEchogenicity: "hypoechoic_area",
      nonMassDistribution: "segmental",
      nonMassAssociatedFeatures: "calcifications",
    };
    const out = executeClinicalTool("calculate_birads", input);
    assert.equal(out.inputEcho.nonMassDistribution, "segmental");
    assert.deepEqual(out.result, json(evaluateBirads(input)));
  });

  it("descriptor typo is rejected instead of falling back to BI-RADS 0", () => {
    const out = executeClinicalTool("calculate_birads", { ...BIRADS_SPICULATED, margin: "Spiculated" });
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /margin: недопустимое значение «Spiculated»/);
  });

  it("findingType is required (no silent default to mass)", () => {
    const out = executeClinicalTool("calculate_birads", omit(BIRADS_SPICULATED, "findingType"));
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /findingType/);
  });
});

describe("IOTA tools — parity", () => {
  const adnex = {
    ageYears: 61,
    oncologyCenter: false,
    maxDiameterMm: 50,
    maxSolidDiameterMm: 45,
    moreThan10Locules: true,
    papillaryCount: 0 as const,
    acousticShadows: false,
    ascites: true,
    ca125Uml: 20,
  };

  it("ADNEX full result equals direct calculateAdnex (+ compare annotation)", () => {
    const out = executeClinicalTool("calculate_adnex", { ...adnex, oradsCategory: 5 });
    const direct = calculateAdnex(adnex);
    assert.ok(!("errors" in direct));
    assert.deepEqual(withoutToolAnnotations(out.result), json(direct));
    assert.deepEqual(out.result?.compareWithOrads, json(compareIotaRiskWithOrads(direct.malignancyRisk, { categoryNumber: 5 })));
  });

  it("LR2 full result equals direct calculateLr2", () => {
    const input = {
      ageYears: 45,
      ascites: false,
      bloodFlowInSolidPapillary: true,
      maxSolidDiameterMm: 20,
      irregularInternalWalls: true,
      acousticShadows: false,
    };
    const out = executeClinicalTool("calculate_lr2", input);
    assert.deepEqual(withoutToolAnnotations(out.result), json(calculateLr2(input)));
  });

  it("Simple Rules Risk full result equals direct calculateSimpleRulesRisk", () => {
    const input = { oncologyCenter: true, benignFeatures: ["B4" as const], malignantFeatures: ["M1" as const, "M4" as const] };
    const out = executeClinicalTool("calculate_srrisk", input);
    assert.deepEqual(withoutToolAnnotations(out.result), json(calculateSimpleRulesRisk(input)));
  });

  it("Simple Rules Risk: missing feature lists are rejected (not read as 'no features')", () => {
    const out = executeClinicalTool("calculate_srrisk", { oncologyCenter: false });
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /benignFeatures/);
    assert.match(out.error ?? "", /malignantFeatures/);
  });

  it("Simple Rules Risk: B-codes in malignant list are rejected at the schema", () => {
    const out = executeClinicalTool("calculate_srrisk", {
      oncologyCenter: false,
      benignFeatures: [],
      malignantFeatures: ["B1"],
    });
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /malignantFeatures/);
  });
});

describe("assess_fmf_screening — parity", () => {
  it("full result equals direct engine; categorical markers are forwarded", () => {
    const input = { crlMm: 60, ntMm: 2.1, nasalBone: "absent" as const, dvAWave: "reversed" as const, sbpMmHg: 120, dbpMmHg: 75 };
    const out = executeClinicalTool("assess_fmf_screening", input);
    assert.equal(out.ok, true);
    assert.deepEqual(withoutToolAnnotations(out.result), json(assessFirstTrimesterScreening(input)));
    assert.ok(Array.isArray(out.result?.categorical) && (out.result.categorical as unknown[]).length === 2);
  });
});

describe("strict validation boundary", () => {
  it("unknown fields are rejected for every tool", () => {
    const cases: Array<[string, Record<string, unknown>]> = [
      ["calculate_orads", { ...ORADS_ENDOMETRIOMA, patientName: "x" }],
      ["calculate_birads", { ...BIRADS_SPICULATED, extra: 1 }],
      ["calculate_tirads", { ...TIRADS_TR4, noduleLocation: "left lobe" }],
      ["calculate_adnex", { ageYears: 50, foo: true }],
      ["calculate_lr2", { ageYears: 50, foo: true }],
      ["calculate_srrisk", { oncologyCenter: false, benignFeatures: [], malignantFeatures: [], foo: 1 }],
      ["assess_fmf_screening", { crlMm: 60, foo: 1 }],
    ];
    for (const [tool, input] of cases) {
      const r = validateToolCall(tool, input);
      assert.equal(r.ok, false, tool);
      if (!r.ok) assert.match(r.error, /неизвестное поле/, tool);
    }
  });

  it("wrong types are rejected with a readable message naming the field", () => {
    const out = executeClinicalTool("calculate_orads", { ...ORADS_ENDOMETRIOMA, lengthMm: "40" });
    assert.equal(out.ok, false);
    assert.match(out.error ?? "", /^Некорректные входные данные: lengthMm/);
    const color = executeClinicalTool("calculate_orads", { ...ORADS_MULTILOC_CS4, iotaColorScore: 4 });
    assert.equal(color.ok, false);
    assert.match(color.error ?? "", /iotaColorScore/);
  });

  it("non-finite numbers are rejected", () => {
    const r = validateToolCall("calculate_tirads", { ...TIRADS_TR4, largestDiameterMm: Number.POSITIVE_INFINITY });
    assert.equal(r.ok, false);
  });

  it("free-text O-RADS description is not accepted by the tool", () => {
    const r = validateToolCall("calculate_orads", { ...ORADS_ENDOMETRIOMA, customDescription: "text" });
    assert.equal(r.ok, false);
  });

  it("long rejected values are truncated in the error", () => {
    const out = executeClinicalTool("calculate_birads", { ...BIRADS_SPICULATED, margin: "x".repeat(500) });
    assert.equal(out.ok, false);
    assert.ok((out.error ?? "").length < 400);
  });
});
